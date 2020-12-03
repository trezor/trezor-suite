const path = require('path');
const { exec } = require('child_process');

const projectRoot = path.join(__dirname, '..');

const { createServer } = require('http');
const next = require('next')({
    dev: true,
    dir: projectRoot,
});

next.prepare().then(() => {
    const requestHandler = next.getRequestHandler();
    const server = createServer(requestHandler).listen(8000, () => {
        const electron = exec('yarn run dev:run', {
            cwd: projectRoot,
        });

        electron.on('close', () => {
            server.close();
            process.exit(0);
        });
    });
});
