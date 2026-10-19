const fs = require('fs');
const path = require('path');

const basePath = 'Backend/src/main/java/com/project/backend';

const backendFolders = [
  `${basePath}/config`,
  `${basePath}/controllers`,
  `${basePath}/services`,
  `${basePath}/repositories`,
  `${basePath}/entities`,
  `${basePath}/dtos`,
  `${basePath}/exceptions`,
  `${basePath}/security`,
  `${basePath}/utils`
];

backendFolders.forEach((folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

console.log('Backend folder architecture created successfully!');
