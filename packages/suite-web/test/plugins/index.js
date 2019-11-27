/* eslint-disable @typescript-eslint/no-var-requires */

// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
const cypressTypeScriptPreprocessor = require('./ts-preprocessor');
const path = require('path');
const { spawn } = require('child_process');

const { Controller } = require('./python/websocket-client');

const controller = new Controller({ url: 'ws://localhost:9001/' });

// let pythonProcess;
// const spawnProcess = () => {
//     const src = path.resolve(__dirname, './python/main.py');
//     const child = spawn('python3', [src], {
//         detached: true,
//         stdio: ['ignore', 'ignore', 'ignore'],
//     });
//     return child;
// };

module.exports = on => {
    addMatchImageSnapshotPlugin(on);
    on('file:preprocessor', cypressTypeScriptPreprocessor);
    on('before:browser:launch', (browser = {}, args) => {
        if (browser.name === 'chrome') {
            args.push('--disable-dev-shm-usage');
            return args;
        }
        return args;
    });

    on('task', {
        // startPython: async () => {
        //     pythonProcess = spawnProcess();
        //     return new Promise((resolve, reject) => {
        //         setTimeout(() => resolve(null), 3000);
        //         pythonProcess.on('error', err => {
        //             reject();
        //         });
        //     });
        // },
        startBridge: async () => {
            await controller.connect();
            const response = await controller.send({ type: 'bridge-start' });
            return null;
        },
        startEmu: async () => {
            await controller.connect();
            const response = await controller.send({ type: 'emulator-start' });
            return null;
        },
    });
};
