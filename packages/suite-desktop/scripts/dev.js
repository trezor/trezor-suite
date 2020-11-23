const path = require('path');
const { exec } = require('child_process');

const launchElectron = process.env.LAUNCH_ELECTRON === 'true';
const projectRoot = path.join(__dirname, '..');

const { createServer } = require('http');
const next = require('next')({
    dev: true,
    dir: projectRoot,
});

next.prepare().then(() => {
    const requestHandler = next.getRequestHandler();
    const server = createServer(requestHandler).listen(8000, () => {
        if (!launchElectron) {
            console.error('process.env.LAUNCH_ELECTRON not set to true')
            return process.exit(1);
        }

        const electron = exec('yarn run dev:run', {
            cwd: projectRoot,
        });

        electron.on('close', () => {
            server.close();
            process.exit(0);
        });
    });
});
