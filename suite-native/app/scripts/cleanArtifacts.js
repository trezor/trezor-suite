const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../artifacts');
if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
        fs.rmSync(path.join(dir, name), { recursive: true, force: true });
    }
}
