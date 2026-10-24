const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const loadE2eEnv = () => {
    ['.env.test.local', '.env.test'].forEach(fileName => {
        const filePath = path.resolve(__dirname, '..', fileName);
        if (fs.existsSync(filePath)) {
            process.loadEnvFile(filePath);
        }
    });
};

module.exports = { loadE2eEnv };

if (require.main === module) {
    loadE2eEnv();
    const [command, ...args] = process.argv.slice(2);
    const { status } = spawnSync(command, args, { stdio: 'inherit' });
    process.exit(status ?? 1);
}
