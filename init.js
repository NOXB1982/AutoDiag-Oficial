const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = __dirname;
const tempDir = path.join(targetDir, 'temp-app');

console.log('Running create-next-app...');
execSync('npx.cmd -y create-next-app@latest temp-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm', { stdio: 'inherit', cwd: targetDir });

console.log('Moving files...');
function moveFiles(source, dest) {
    fs.readdirSync(source).forEach(file => {
        fs.renameSync(path.join(source, file), path.join(dest, file));
    });
}

moveFiles(tempDir, targetDir);
fs.rmdirSync(tempDir);
console.log('Project Scaffolding Complete.');
