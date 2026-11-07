#!/usr/bin/env python3
"""SkyShield Asset Management - single-file endpoint inventory and monitoring agent.

Cross-platform asset inventory and best-effort monitoring for Windows, Linux and macOS.
Some security-log and removable-device features are OS-specific or not implemented on
every platform; inspect each command's status and warnings before relying on it.
Python 3.10+ recommended. Dependency: psutil (`python -m pip install psutil`).

This agent is read-only with respect to scanned files. It does not execute,
modify, delete, quarantine, or upload file contents. It writes JSON/JSONL reports
under ./sentinel_logs. Backend/API delivery is intentionally not implemented;
connect it after the SkyShield Node.js API contract is supplied.

Platform limitations are reported in feature status fields and console output.
"""
from __future__ import annotations

import argparse
import ctypes
import hashlib
import json
import os
import platform
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import uuid
from collections import Counter, defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

try:
    import psutil
except ImportError:  # Friendly error shown by main()
    psutil = None

BASE_DIR = Path(__file__).resolve().parent
LOG_DIR = BASE_DIR / "sentinel_logs"
USB_REPORT_DIR = LOG_DIR / "usb_inventory"
EVENT_FILE = LOG_DIR / "security_events.jsonl"
POLL_INTERVAL = 3
FAILED_LOGIN_WINDOW_MINUTES = 10
FAILED_LOGIN_THRESHOLD = 3  # Alert when attempts are greater than this value.
DELETION_THRESHOLD = 3      # Alert when deleted files reach this value.
MAX_SCAN_FILES = 50000
MAX_WATCH_FILES = 50000

SUSPICIOUS_EXTENSIONS = {
    ".exe", ".scr", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".jse",
    ".wsf", ".hta", ".msi", ".dll", ".com", ".sh", ".py", ".jar",
}
RANSOMWARE_EXTENSIONS = {
    ".locked", ".encrypted", ".crypt", ".locky", ".wncry", ".zepto",
}

_event_lock = threading.Lock()


def now_iso() -> str:
    return datetime.now().astimezone().isoformat()


def ensure_log_dirs() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    USB_REPORT_DIR.mkdir(parents=True, exist_ok=True)


def log_event(event_type: str, severity: str, description: str,
              details: dict[str, Any] | None = None) -> dict[str, Any]:
    """Append one structured event to the local JSON Lines event log."""
    ensure_log_dirs()
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "severity": severity.upper(),
        "description": description,
        "timestamp": now_iso(),
        "hostname": socket.gethostname(),
        "details": details or {},
        "status": "NEW",
    }
    with _event_lock:
        with EVENT_FILE.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(event, ensure_ascii=False, default=str) + "\n")
    print(f"[EVENT] {event['severity']}: {event_type}")
    return event


def get_local_ip() -> str | None:
    """Return the local interface IP selected for outbound IPv4 traffic."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("192.0.2.1", 80))  # TEST-NET address; no packet is sent.
        return sock.getsockname()[0]
    except OSError:
        return None
    finally:
        sock.close()


def get_mac_address() -> str | None:
    value = uuid.getnode()
    # Bit 1 of the first octet indicates a locally administered address.
    mac = ":".join(f"{(value >> shift) & 0xff:02X}" for shift in range(40, -1, -8))
    return mac if value else None


def _run_command(command: list[str], timeout: int = 30) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, capture_output=True, text=True,
                          timeout=timeout, check=False,
                          errors="replace")


def get_installed_software() -> dict[str, Any]:
    """Best-effort installed application inventory for the current OS."""
    system = platform.system()
    applications: list[dict[str, str]] = []
    warnings: list[str] = []
    try:
        if system == "Windows":
            import winreg  # Windows-only; imported only on Windows.
            locations = [
                (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
                (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
                (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
            ]
            for hive, key_path in locations:
                try:
                    with winreg.OpenKey(hive, key_path) as root:
                        count = winreg.QueryInfoKey(root)[0]
                        for index in range(count):
                            try:
                                subkey_name = winreg.EnumKey(root, index)
                                with winreg.OpenKey(root, subkey_name) as app_key:
                                    try:
                                        name = str(winreg.QueryValueEx(app_key, "DisplayName")[0]).strip()
                                    except OSError:
                                        continue
                                    def query(field: str) -> str:
                                        try:
                                            return str(winreg.QueryValueEx(app_key, field)[0])
                                        except OSError:
                                            return "Unknown"
                                    if name:
                                        applications.append({"name": name,
                                                             "version": query("DisplayVersion"),
                                                             "publisher": query("Publisher")})
                            except OSError:
                                continue
                except OSError as exc:
                    warnings.append(f"Registry location unavailable: {exc}")
        elif system == "Darwin":
            result = _run_command(["system_profiler", "SPApplicationsDataType", "-detailLevel", "mini"], 90)
            if result.returncode == 0:
                for line in result.stdout.splitlines():
                    stripped = line.strip()
                    if stripped.endswith(":") and not stripped.startswith(("Location:", "Obtained from:")):
                        name = stripped[:-1].strip()
                        if name and not name.endswith((".app",)):
                            applications.append({"name": name, "version": "Unknown", "publisher": "Unknown"})
            else:
                warnings.append(result.stderr.strip() or "system_profiler failed")
        elif system == "Linux":
            candidates = [
                ["dpkg-query", "-W", "-f=${binary:Package}\t${Version}\n"],
                ["rpm", "-qa", "--qf", "%{NAME}\t%{VERSION}-%{RELEASE}\n"],
                ["pacman", "-Q"],
            ]
            for command in candidates:
                try:
                    result = _run_command(command, 60)
                except (OSError, subprocess.TimeoutExpired):
                    continue
                if result.returncode == 0:
                    for line in result.stdout.splitlines():
                        parts = line.strip().split("\t", 1)
                        if len(parts) == 1:
                            parts = line.strip().split(None, 1)
                        if parts and parts[0]:
                            applications.append({"name": parts[0],
                                                 "version": parts[1] if len(parts) > 1 else "Unknown",
                                                 "publisher": "Unknown"})
                    break
            if not applications:
                warnings.append("No supported package manager inventory command succeeded (dpkg/rpm/pacman).")
        else:
            warnings.append(f"Software inventory is not implemented for {system}.")
    except Exception as exc:
        warnings.append(str(exc))

    unique: dict[tuple[str, str], dict[str, str]] = {}
    for app in applications:
        unique[(app["name"].casefold(), app["version"].casefold())] = app
    result_apps = sorted(unique.values(), key=lambda item: item["name"].casefold())
    return {"count": len(result_apps), "applications": result_apps,
            "status": "COLLECTED" if result_apps else "EMPTY_OR_UNAVAILABLE",
            "warnings": warnings}


def collect_asset_inventory() -> dict[str, Any]:
    if psutil is None:
        raise RuntimeError("Missing dependency 'psutil'. Install it with: python -m pip install psutil")
    vm = psutil.virtual_memory()
    disk_records = []
    seen_mounts: set[str] = set()
    for partition in psutil.disk_partitions(all=False):
        mount = partition.mountpoint
        if mount in seen_mounts:
            continue
        seen_mounts.add(mount)
        try:
            usage = psutil.disk_usage(mount)
            disk_records.append({
                "device": partition.device,
                "mountpoint": mount,
                "filesystem": partition.fstype,
                "total_gb": round(usage.total / 1024**3, 2),
                "used_gb": round(usage.used / 1024**3, 2),
                "free_gb": round(usage.free / 1024**3, 2),
            })
        except (PermissionError, OSError):
            continue
    software = get_installed_software()
    asset = {
        "schema_version": "1.0",
        "asset_id": str(uuid.getnode()),
        "hostname": socket.gethostname(),
        "ip_address": get_local_ip(),
        "mac_address": get_mac_address(),
        "operating_system": platform.system(),
        "os_release": platform.release(),
        "os_version": platform.version(),
        "architecture": platform.machine(),
        "processor": platform.processor() or None,
        "python_version": platform.python_version(),
        "ram_total_gb": round(vm.total / 1024**3, 2),
        "ram_available_gb": round(vm.available / 1024**3, 2),
        "ram_percent_used": vm.percent,
        "disks": disk_records,
        "software_inventory": software,
        "last_seen": now_iso(),
        "collection_notes": [
            "IP address is the local outbound-interface address, not the public IP.",
            "MAC address may be randomized or locally administered by the OS/network.",
            "Installed software inventory depends on OS package/registry sources and may be incomplete.",
        ],
    }
    ensure_log_dirs()
    output = LOG_DIR / "asset_inventory.json"
    output.write_text(json.dumps(asset, indent=2, ensure_ascii=False), encoding="utf-8")
    log_event("ASSET_INVENTORY_COLLECTED", "INFO", "Endpoint asset inventory collected",
              {"asset_id": asset["asset_id"], "hostname": asset["hostname"],
               "operating_system": asset["operating_system"],
               "software_count": software["count"], "report_file": str(output)})
    print(f"Asset inventory saved: {output}")
    return asset


def get_firewall_status() -> dict[str, Any]:
    """Collect firewall status and settings using the host OS utility."""
    system = platform.system()
    profiles: dict[str, Any] = {}
    warnings: list[str] = []
    try:
        if system == "Windows":
            result = _run_command(["netsh", "advfirewall", "show", "allprofiles"], 20)
            if result.returncode != 0:
                raise RuntimeError(result.stderr.strip() or "netsh failed")

            current: str | None = None
            for line in result.stdout.splitlines():
                stripped = line.strip()
                if not stripped:
                    continue

                header = re.match(r"^(Domain|Private|Public)\s+Profile\s+Settings\s*:$", stripped, re.IGNORECASE)
                if header:
                    current = header.group(1).lower()
                    profiles[current] = {}
                    continue

                if current:
                    # netsh formats values in aligned columns, not necessarily with a colon.
                    # Split on two or more spaces so values such as "BlockInbound,AllowOutbound"
                    # and "N/A (GPO-store only)" remain intact.
                    columns = re.split(r"\s{2,}", stripped, maxsplit=1)
                    if len(columns) == 2:
                        key, value = columns[0].strip(), columns[1].strip()
                        if key and value:
                            profiles[current][key.lower().replace(" ", "_")] = value

            missing = [
                profile for profile in ("domain", "private", "public")
                if profile not in profiles or "state" not in profiles[profile]
            ]
            if missing:
                warnings.append("Firewall profile state could not be parsed for: " + ", ".join(missing))
            if not profiles:
                warnings.append("Could not parse firewall profiles from netsh output.")

        elif system == "Linux":
            if shutil.which("ufw"):
                result = _run_command(["ufw", "status", "verbose"], 15)
                profiles["ufw"] = {
                    "status": result.stdout.strip() or result.stderr.strip(),
                    "return_code": result.returncode,
                }
                if result.returncode != 0:
                    warnings.append("ufw returned a non-zero exit code; elevated privileges may be required.")
            elif shutil.which("firewall-cmd"):
                result = _run_command(["firewall-cmd", "--state"], 15)
                profiles["firewalld"] = {
                    "status": result.stdout.strip() or result.stderr.strip(),
                    "return_code": result.returncode,
                }
                if result.returncode != 0:
                    warnings.append("firewall-cmd returned a non-zero exit code.")
            elif shutil.which("nft"):
                result = _run_command(["nft", "list", "ruleset"], 15)
                profiles["nftables"] = {
                    "ruleset_present": bool(result.stdout.strip()),
                    "return_code": result.returncode,
                    "details": result.stdout.strip()[:12000],
                }
                if result.returncode != 0:
                    warnings.append("nft could not read the ruleset; permissions may be required.")
            else:
                warnings.append("No supported firewall command found (ufw, firewall-cmd, nft).")

        elif system == "Darwin":
            command = "/usr/libexec/ApplicationFirewall/socketfilterfw"
            if Path(command).exists():
                result = _run_command([command, "--getglobalstate"], 15)
                profiles["application_firewall"] = {
                    "status": result.stdout.strip() or result.stderr.strip(),
                    "return_code": result.returncode,
                }
                if result.returncode != 0:
                    warnings.append("macOS Application Firewall query returned a non-zero exit code.")
            else:
                warnings.append("macOS Application Firewall utility not found.")
        else:
            warnings.append(f"Firewall collection is not implemented for {system}.")

    except (OSError, RuntimeError, subprocess.TimeoutExpired) as exc:
        warnings.append(str(exc))

    if system == "Windows":
        complete = all(
            profile in profiles and "state" in profiles[profile]
            for profile in ("domain", "private", "public")
        )
    else:
        complete = bool(profiles) and not warnings

    status = "COLLECTED" if complete and not warnings else (
        "PARTIAL_OR_UNAVAILABLE" if not profiles else "PARTIAL"
    )
    return {
        "platform": system,
        "profiles": profiles,
        "status": status,
        "warnings": warnings,
        "checked_at": now_iso(),
    }


def collect_firewall() -> dict[str, Any]:
    result = get_firewall_status()
    severity = "INFO" if result["status"] == "COLLECTED" else "WARNING"
    log_event("FIREWALL_STATUS_CHECK", severity, "Firewall status check completed", result)
    print(json.dumps(result, indent=2))
    return result


def check_suspicious_filename(filename: str) -> list[str]:
    lower = filename.lower()
    suffix = Path(lower).suffix
    reasons: list[str] = []
    if suffix in RANSOMWARE_EXTENSIONS:
        reasons.append("Extension resembles a known ransomware-related extension; verify manually")
    if suffix in SUSPICIOUS_EXTENSIONS:
        reasons.append("Executable or script extension; review required")
    parts = lower.split(".")
    if len(parts) >= 3 and ("." + parts[-1]) in SUSPICIOUS_EXTENSIONS:
        reasons.append("Double extension ending in an executable/script type")
    return reasons


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inspect_file(path: Path, root: Path) -> dict[str, Any]:
    record: dict[str, Any] = {
        "file_name": path.name,
        "relative_path": str(path.relative_to(root)),
        "extension": path.suffix.lower(),
        "size_bytes": None,
        "created_at": None,
        "modified_at": None,
        "sha256": None,
        "suspicious": False,
        "reasons": [],
        "scan_error": None,
    }
    try:
        if path.is_symlink():
            record["scan_error"] = "Symbolic link skipped"
            return record
        before = path.stat()
        record["size_bytes"] = before.st_size
        # Windows st_ctime is creation time; on Unix it is metadata-change time.
        if platform.system() == "Windows":
            record["created_at"] = datetime.fromtimestamp(before.st_ctime).astimezone().isoformat()
        else:
            record["metadata_changed_at"] = datetime.fromtimestamp(before.st_ctime).astimezone().isoformat()
        record["modified_at"] = datetime.fromtimestamp(before.st_mtime).astimezone().isoformat()
        record["reasons"] = check_suspicious_filename(path.name)
        record["suspicious"] = bool(record["reasons"])
        record["sha256"] = sha256_file(path)
        after = path.stat()
        if before.st_size != after.st_size or before.st_mtime_ns != after.st_mtime_ns:
            record["scan_error"] = "File changed while it was being hashed; hash may not represent a stable snapshot"
    except (OSError, PermissionError) as exc:
        record["scan_error"] = str(exc)
    return record


def scan_directory(target: str | Path, drive: str | None = None) -> dict[str, Any]:
    root = Path(target).expanduser().resolve()
    if not root.is_dir():
        raise ValueError(f"Invalid scan directory: {root}")
    scan_id = str(uuid.uuid4())
    started = now_iso()
    records: list[dict[str, Any]] = []
    folders = 0
    errors = 0
    truncated = False

    def walk_error(exc: OSError) -> None:
        nonlocal errors
        errors += 1
        print(f"[ACCESS ERROR] {exc}")

    for current, dirs, filenames in os.walk(root, topdown=True, followlinks=False, onerror=walk_error):
        current_path = Path(current)
        dirs[:] = [d for d in dirs if not (current_path / d).is_symlink()]
        folders += 1
        for filename in filenames:
            if len(records) >= MAX_SCAN_FILES:
                truncated = True
                break
            record = inspect_file(current_path / filename, root)
            records.append(record)
            if record["scan_error"]:
                errors += 1
            if record["suspicious"]:
                print(f"[REVIEW] {record['relative_path']}: {', '.join(record['reasons'])}")
        if truncated:
            break

    try:
        usage = shutil.disk_usage(root)
        storage = {"capacity_gb": round(usage.total / 1024**3, 2),
                   "used_gb": round(usage.used / 1024**3, 2),
                   "free_gb": round(usage.free / 1024**3, 2)}
    except OSError as exc:
        storage = {"error": str(exc)}
    hashed = sum(1 for item in records if item["sha256"])
    suspicious = sum(1 for item in records if item["suspicious"])
    report = {
        "schema_version": "1.0", "scan_id": scan_id,
        "started_at": started, "completed_at": now_iso(),
        "scan_status": "TRUNCATED" if truncated else ("COMPLETED_WITH_ERRORS" if errors else "COMPLETED"),
        "device": {"drive": drive, "scan_target": str(root), "storage": storage},
        "summary": {"folders_scanned": folders, "total_files": len(records),
                    "files_hashed": hashed, "suspicious_files": suspicious,
                    "scan_errors": errors, "max_file_limit": MAX_SCAN_FILES,
                    "truncated": truncated},
        "files": records,
        "safety_note": "Read-only inventory. Files are not executed, modified, deleted, quarantined or copied. Filename indicators do not prove malware.",
    }
    ensure_log_dirs()
    report_path = USB_REPORT_DIR / f"usb_scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{scan_id[:8]}.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    severity = "WARNING" if suspicious else ("ERROR" if errors else "INFO")
    log_event("USB_THREAT_SCAN", severity, "File inventory and SHA-256 scan completed",
              {"scan_id": scan_id, "drive": drive, "summary": report["summary"],
               "report_file": str(report_path)})
    print("\n=== SKYSHIELD FILE SCAN ===")
    print(f"Target: {root}\nFiles: {len(records)} | Hashed: {hashed} | Review indicators: {suspicious} | Errors: {errors}")
    print(f"Report: {report_path}")
    return report


def _windows_removable_drives() -> set[str]:
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.GetLogicalDrives.restype = ctypes.c_uint32
    kernel32.GetDriveTypeW.argtypes = [ctypes.c_wchar_p]
    kernel32.GetDriveTypeW.restype = ctypes.c_uint
    mask = kernel32.GetLogicalDrives()
    if not mask:
        raise ctypes.WinError(ctypes.get_last_error())
    found = set()
    for index in range(26):
        if mask & (1 << index):
            drive = f"{chr(65 + index)}:\\"
            if kernel32.GetDriveTypeW(drive) == 2:  # DRIVE_REMOVABLE
                found.add(drive)
    return found


def get_removable_mounts() -> set[str]:
    """Best-effort removable storage discovery; some USB disks appear fixed."""
    system = platform.system()
    if system == "Windows":
        return _windows_removable_drives()
    if psutil is None:
        raise RuntimeError("psutil is required for removable-volume discovery")
    found: set[str] = set()
    for part in psutil.disk_partitions(all=False):
        mount = part.mountpoint
        source = part.device.lower()
        if system == "Darwin":
            if mount.startswith("/Volumes/") and mount != "/Volumes":
                found.add(mount)
        elif system == "Linux":
            # Prefer Linux sysfs removable flag when it can be resolved.
            removable = False
            try:
                device_name = Path(source).name
                if device_name.startswith("/dev/"):
                    device_name = device_name[5:]
                while device_name and device_name[-1].isdigit():
                    device_name = device_name[:-1]
                flag = Path("/sys/block") / device_name / "removable"
                if flag.exists():
                    removable = flag.read_text(encoding="utf-8").strip() == "1"
            except OSError:
                pass
            if removable or mount.startswith(("/media/", "/run/media/", "/mnt/usb", "/mnt/USB")):
                found.add(mount)
    return found


def monitor_usb() -> None:
    print(f"USB/removable-volume monitor running on {platform.system()}. Press Ctrl+C to stop.")
    previous = get_removable_mounts()
    for mount in sorted(previous):
        print(f"[PRESENT AT START] {mount}")
    log_event("USB_MONITOR_STARTED", "INFO", "Removable-volume monitoring started",
              {"initial_mounts": sorted(previous), "poll_interval_seconds": POLL_INTERVAL})
    while True:
        time.sleep(POLL_INTERVAL)
        try:
            current = get_removable_mounts()
            for mount in sorted(current - previous):
                print(f"[USB CONNECTED] {mount}")
                log_event("USB_CONNECTED", "WARNING", "Removable storage volume detected",
                          {"mountpoint": mount, "connected_at": now_iso()})
                try:
                    scan_directory(mount, mount)
                except Exception as exc:
                    log_event("USB_SCAN_ERROR", "ERROR", "Automatic removable-volume scan failed",
                              {"mountpoint": mount, "error": str(exc)})
            for mount in sorted(previous - current):
                print(f"[USB DISCONNECTED] {mount}")
                log_event("USB_DISCONNECTED", "INFO", "Removable storage volume disappeared",
                          {"mountpoint": mount, "disconnected_at": now_iso()})
            previous = current
        except Exception as exc:
            print(f"[USB MONITOR WARNING] {exc}")
            log_event("USB_MONITOR_ERROR", "ERROR", "Removable-volume detection failed", {"error": str(exc)})


WINDOWS_FAILED_LOGIN_PS = r"""
$start = (Get-Date).AddMinutes(-10)
$items = @(Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625; StartTime=$start} -ErrorAction Stop | ForEach-Object {
  [xml]$x=$_.ToXml(); $d=@{}; foreach($v in $x.Event.EventData.Data){$d[$v.Name]=$v.InnerText}
  [pscustomobject]@{TimeCreated=$_.TimeCreated.ToUniversalTime().ToString('o'); Account=[string]$d['TargetUserName']; Domain=[string]$d['TargetDomainName']; SID=[string]$d['TargetUserSid']}
})
ConvertTo-Json -InputObject $items -Compress
"""


def read_failed_logins() -> list[dict[str, Any]]:
    """Read failed OS logons where supported. Windows Security log requires access/auditing."""
    system = platform.system()
    if system == "Windows":
        result = _run_command(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", WINDOWS_FAILED_LOGIN_PS], 40)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or "Cannot read Windows Security log; check permissions and audit policy.")
        output = result.stdout.strip()
        if not output:
            return []
        parsed = json.loads(output)
        return [parsed] if isinstance(parsed, dict) else parsed
    if system == "Linux":
        if not shutil.which("journalctl"):
            raise RuntimeError("journalctl is unavailable; Linux authentication-log parsing is not configured.")
        result = _run_command(["journalctl", "--since", "10 minutes ago", "-o", "short-iso", "--no-pager"], 30)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or "journalctl failed; permissions may be required.")
        # Deliberately do not guess account identities from distro-specific free text.
        raise RuntimeError("Linux journal was reachable, but reliable account-level failed-login parsing is not implemented in this version.")
    raise RuntimeError(f"Failed-login collection is not implemented for {system} in this version.")


_failed_login_alert_fingerprints: set[tuple[str, str, int]] = set()


def detect_repeated_failed_logins(events: list[dict[str, Any]]) -> int:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=FAILED_LOGIN_WINDOW_MINUTES)
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for event in events:
        account = str(event.get("Account", "")).strip()
        if not account:
            continue
        try:
            timestamp = datetime.fromisoformat(str(event["TimeCreated"]).replace("Z", "+00:00"))
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
        except (KeyError, ValueError):
            continue
        if cutoff <= timestamp <= now:
            sid = str(event.get("SID", "")).strip()
            domain = str(event.get("Domain", "")).strip()
            key = sid if sid and sid != "S-1-0-0" else f"{domain}\\{account}".casefold()
            grouped[key].append(event)
    alerts = 0
    for failures in grouped.values():
        if len(failures) > FAILED_LOGIN_THRESHOLD:
            latest = max(failures, key=lambda item: item.get("TimeCreated", ""))
            fingerprint = (key, str(latest.get("TimeCreated", "")), len(failures))
            if fingerprint in _failed_login_alert_fingerprints:
                continue
            _failed_login_alert_fingerprints.add(fingerprint)
            # Keep the in-memory deduplication set bounded during long-running monitoring.
            if len(_failed_login_alert_fingerprints) > 2000:
                _failed_login_alert_fingerprints.clear()
                _failed_login_alert_fingerprints.add(fingerprint)
            details = {
                "account": latest.get("Account"),
                "domain": latest.get("Domain"),
                "failed_attempts": len(failures),
                "threshold": FAILED_LOGIN_THRESHOLD,
                "window_minutes": FAILED_LOGIN_WINDOW_MINUTES,
                "detection_source": "WINDOWS_SECURITY_EVENT_4625",
            }
            log_event(
                "REPEATED_FAILED_LOGINS",
                "WARNING",
                "More than three failed logins for one account within ten minutes",
                details,
            )
            alerts += 1
    print(f"Failed-login records read: {len(events)}; threshold alerts: {alerts}")
    return alerts


def check_failed_logins() -> None:
    try:
        events = read_failed_logins()
        detect_repeated_failed_logins(events)
    except (OSError, RuntimeError, subprocess.TimeoutExpired, json.JSONDecodeError) as exc:
        print(f"[FAILED-LOGIN NOT AVAILABLE] {exc}")
        log_event("FAILED_LOGIN_CHECK_UNAVAILABLE", "WARNING", "Failed-login check could not be completed", {"error": str(exc), "platform": platform.system()})


def _snapshot_tree(root: Path) -> dict[str, tuple[int, int]]:
    snapshot: dict[str, tuple[int, int]] = {}
    count = 0
    for current, dirs, files in os.walk(root, followlinks=False):
        current_path = Path(current)
        dirs[:] = [name for name in dirs if not (current_path / name).is_symlink()]
        for name in files:
            path = current_path / name
            try:
                if path.is_symlink():
                    continue
                stat = path.stat()
                snapshot[str(path)] = (stat.st_size, stat.st_mtime_ns)
                count += 1
                if count >= MAX_WATCH_FILES:
                    return snapshot
            except OSError:
                continue
    return snapshot


def watch_deletions(directory: str | Path, interval: int = 5) -> None:
    """Poll a user-selected directory; this is not system-wide deletion auditing."""
    root = Path(directory).expanduser().resolve()
    if not root.is_dir():
        raise ValueError(f"Deletion watch directory does not exist: {root}")
    print(f"Watching deletions under: {root} (poll every {interval}s). Ctrl+C to stop.")
    print("Note: only files in this selected directory are monitored; transient create-delete activity between polls may be missed.")
    previous = _snapshot_tree(root)
    recent_deletions: deque[tuple[datetime, str]] = deque()
    log_event("FILE_DELETION_WATCH_STARTED", "INFO", "Directory deletion monitoring started",
              {"directory": str(root), "initial_files": len(previous), "poll_interval_seconds": interval})
    try:
        while True:
            time.sleep(interval)
            current = _snapshot_tree(root)
            deleted = set(previous) - set(current)
            now = datetime.now(timezone.utc)
            for path in sorted(deleted):
                recent_deletions.append((now, path))
            cutoff = now - timedelta(minutes=10)
            while recent_deletions and recent_deletions[0][0] < cutoff:
                recent_deletions.popleft()
            if deleted:
                print(f"[DELETION] {len(deleted)} file(s) disappeared from watched directory")
            if len(recent_deletions) >= DELETION_THRESHOLD:
                log_event("BULK_FILE_DELETION", "WARNING", "Multiple files disappeared from watched directory within ten minutes",
                          {"directory": str(root), "deleted_count_in_window": len(recent_deletions),
                           "threshold": DELETION_THRESHOLD, "window_minutes": 10,
                           "recent_paths": [path for _, path in list(recent_deletions)[-100:]],
                           "detection_method": "POLLING_SNAPSHOT"})
                recent_deletions.clear()  # Avoid repeating the same alert every poll.
            previous = current
    except KeyboardInterrupt:
        log_event("FILE_DELETION_WATCH_STOPPED", "INFO", "Directory deletion monitoring stopped", {"directory": str(root)})
        raise


def display_events(limit: int = 20) -> None:
    ensure_log_dirs()
    if not EVENT_FILE.exists():
        print("No security events have been recorded yet.")
        return
    events = []
    with EVENT_FILE.open("r", encoding="utf-8") as handle:
        for line in handle:
            try:
                if line.strip():
                    events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    print(f"\nTotal recorded events: {len(events)}")
    for event_type, count in Counter(e.get("event_type", "UNKNOWN") for e in events).most_common():
        print(f"{event_type:<36} {count}")
    print("\nRecent events:")
    for event in events[-limit:]:
        print(f"{event.get('timestamp')} | {event.get('severity')} | {event.get('event_type')} | {event.get('description')}")


def run_monitoring(deletion_directory: str | None = None, check_logins: bool = True) -> None:
    """Run USB detection in foreground; periodic checks run in a daemon thread."""
    def periodic_checks() -> None:
        while True:
            if check_logins:
                check_failed_logins()
            time.sleep(60)
    thread = threading.Thread(target=periodic_checks, daemon=True, name="failed-login-check")
    thread.start()
    if deletion_directory:
        deletion_thread = threading.Thread(target=watch_deletions,
                                           args=(deletion_directory,), daemon=True,
                                           name="deletion-watch")
        deletion_thread.start()
    monitor_usb()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="SkyShield single-file Asset Management and endpoint monitoring agent.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Examples:\n  python skyshield_asset_management.py inventory\n  python skyshield_asset_management.py firewall\n  python skyshield_asset_management.py scan-path ./usb_test_data\n  python skyshield_asset_management.py monitor\n  python skyshield_asset_management.py watch-deletions ./important_folder\n  python skyshield_asset_management.py failed-logins\n  python skyshield_asset_management.py events",
    )
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("inventory", help="Collect system and installed-software inventory")
    sub.add_parser("firewall", help="Check local firewall status where supported")
    scan = sub.add_parser("scan-path", help="Scan a test folder or mounted volume once")
    scan.add_argument("path", help="Existing directory to scan")
    mon = sub.add_parser("monitor", help="Monitor removable storage; periodically check failed logins")
    mon.add_argument("--watch-dir", help="Optional directory to monitor for bulk deletions")
    mon.add_argument("--no-failed-logins", action="store_true", help="Disable periodic failed-login checks")
    deletion = sub.add_parser("watch-deletions", help="Monitor a selected directory for bulk deletions")
    deletion.add_argument("path", help="Existing directory to monitor")
    deletion.add_argument("--interval", type=int, default=5, help="Polling interval in seconds (default: 5)")
    sub.add_parser("failed-logins", help="Check recent OS failed-login records where supported")
    events = sub.add_parser("events", help="Display recent local security events")
    events.add_argument("--limit", type=int, default=20)
    all_cmd = sub.add_parser("collect", help="Collect asset inventory and firewall status")
    return parser


def main() -> int:
    if psutil is None:
        print("Dependency missing: psutil")
        print("Install it using: python -m pip install psutil")
        return 2
    ensure_log_dirs()
    parser = build_parser()
    args = parser.parse_args()
    try:
        if args.command == "inventory":
            asset = collect_asset_inventory()
            print(f"\nAsset: {asset['hostname']} | OS: {asset['operating_system']} | RAM: {asset['ram_total_gb']} GB")
            print(f"Installed applications discovered: {asset['software_inventory']['count']}")
        elif args.command == "firewall":
            collect_firewall()
        elif args.command == "scan-path":
            scan_directory(args.path)
        elif args.command == "monitor":
            run_monitoring(args.watch_dir, not args.no_failed_logins)
        elif args.command == "watch-deletions":
            if args.interval < 1:
                parser.error("--interval must be at least 1 second")
            watch_deletions(args.path, args.interval)
        elif args.command == "failed-logins":
            check_failed_logins()
        elif args.command == "events":
            display_events(max(1, args.limit))
        elif args.command == "collect":
            collect_asset_inventory()
            collect_firewall()
        return 0
    except KeyboardInterrupt:
        print("\nSkyShield monitoring stopped by user.")
        return 0
    except Exception as exc:
        print(f"[ERROR] {exc}")
        try:
            log_event("AGENT_ERROR", "ERROR", "SkyShield command failed", {"command": args.command, "error": str(exc)})
        except Exception:
            pass
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
