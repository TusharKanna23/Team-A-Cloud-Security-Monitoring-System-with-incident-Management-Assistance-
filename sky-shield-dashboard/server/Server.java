import com.sun.net.httpserver.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.*;

public class Server {
  static int seq = 100;
  static List<Map<String, String>> users = new ArrayList<>(), teams = new ArrayList<>(),
      incidents = new ArrayList<>(), logs = new ArrayList<>();
  static Map<String, String> row(String... kv) {
    Map<String, String> m = new LinkedHashMap<>();
    for (int i = 0; i < kv.length; i += 2) m.put(kv[i], kv[i + 1]);
    return m;
  }
  static String id() { return String.valueOf(++seq); }
  static String esc(String s) { return s.replace("\\", "\\\\").replace("\"", "\\\""); }
  static String json(List<Map<String, String>> l) {
    return l.stream().map(m -> m.entrySet().stream()
        .map(e -> "\"" + e.getKey() + "\":\"" + esc(e.getValue()) + "\"")
        .collect(Collectors.joining(",", "{", "}"))).collect(Collectors.joining(",", "[", "]"));
  }
  static void log(String a) { logs.add(0, row("time", new Date().toString(), "action", a)); }
  public static void main(String[] args) throws Exception {
    users.add(row("id", id(), "name", "Asha Raman", "email", "asha@skyshield.io", "role", "Admin"));
    users.add(row("id", id(), "name", "Karthik S", "email", "karthik@skyshield.io", "role", "Analyst"));
    users.add(row("id", id(), "name", "Meera N", "email", "meera@skyshield.io", "role", "Responder"));
    users.add(row("id", id(), "name", "Dev Patel", "email", "dev@skyshield.io", "role", "Viewer"));
    teams.add(row("id", id(), "name", "SOC Team", "lead", "102", "members", "102,103"));
    teams.add(row("id", id(), "name", "Cloud Ops", "lead", "103", "members", "103,104"));
    incidents.add(row("id", id(), "title", "Unauthorized IAM role assumption", "severity", "Critical", "status", "Open", "team", "101"));
    incidents.add(row("id", id(), "title", "Public S3 bucket detected", "severity", "High", "status", "Investigating", "team", "102"));
    incidents.add(row("id", id(), "title", "Brute-force login attempts", "severity", "Medium", "status", "Open", "team", ""));
    incidents.add(row("id", id(), "title", "Expired TLS certificate", "severity", "Low", "status", "Resolved", "team", "102"));
    log("Server started");
    HttpServer s = HttpServer.create(new InetSocketAddress(8080), 0);
    s.createContext("/api/", ex -> {
      String out;
      try {
        String[] p = ex.getRequestURI().getPath().split("/");
        List<Map<String, String>> t = switch (p[2]) {
          case "users" -> users; case "teams" -> teams; case "incidents" -> incidents; default -> logs; };
        String m = ex.getRequestMethod();
        String body = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Map<String, String> f = new LinkedHashMap<>();
        for (String kv : body.split("&")) {
          if (kv.isEmpty()) continue;
          String[] x = kv.split("=", 2);
          f.put(URLDecoder.decode(x[0], "UTF-8"), x.length > 1 ? URLDecoder.decode(x[1], "UTF-8") : "");
        }
        synchronized (Server.class) {
          if (m.equals("POST")) {
            f.put("id", id()); t.add(0, f);
            log("Created " + p[2] + ": " + f.getOrDefault("name", f.getOrDefault("title", "")));
          } else if (p.length > 3) {
            Optional<Map<String, String>> hit = t.stream().filter(r -> r.get("id").equals(p[3])).findFirst();
            if (hit.isPresent() && m.equals("PUT")) { hit.get().putAll(f); log("Updated " + p[2] + " #" + p[3] + " " + f); }
            if (hit.isPresent() && m.equals("DELETE")) { t.remove(hit.get()); log("Deleted " + p[2] + " #" + p[3]); }
          }
          out = json(t);
        }
      } catch (Exception e) { out = "[]"; }
      byte[] b = out.getBytes(StandardCharsets.UTF_8);
      ex.getResponseHeaders().add("Content-Type", "application/json");
      ex.sendResponseHeaders(200, b.length);
      ex.getResponseBody().write(b);
      ex.close();
    });
    s.start();
    System.out.println("Sky Shield API running on http://localhost:8080");
  }
}
