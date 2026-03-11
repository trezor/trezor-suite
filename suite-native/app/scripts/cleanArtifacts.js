const fs = require('fs');
const path = require('path');

const dirArtifacts = path.resolve(__dirname, '../artifacts');
if (fs.existsSync(dirArtifacts)) {
    for (const name of fs.readdirSync(dirArtifacts)) {
        fs.rmSync(path.join(dirArtifacts, name), { recursive: true, force: true });
    }
}

const dirCurrents = path.resolve(__dirname, '../currents');
if (fs.existsSync(dirCurrents)) {
    for (const name of fs.readdirSync(dirCurrents)) {
        fs.rmSync(path.join(dirCurrents, name), { recursive: true, force: true });
    }
}

const dirReports = path.resolve(__dirname, '../reports');
if (fs.existsSync(dirReports)) {
    for (const name of fs.readdirSync(dirReports)) {
        fs.rmSync(path.join(dirReports, name), { recursive: true, force: true });
    }
}