/* eslint-disable @typescript-eslint/no-var-requires */

// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
const cypressTypeScriptPreprocessor = require('./ts-preprocessor');
const path = require('path');
const { spawn } = require('child_process');

const { Controller } = require('./python/websocket-client');

const controller = new Controller({ url: 'ws://localhost:9001/' });

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
        sendDecision: async method => {
            await controller.connect();
            await controller.send({ type: 'emulator-decision', method });
            return null;
        },
    });
};
