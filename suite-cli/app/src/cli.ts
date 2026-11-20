import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect from '@trezor/connect';

import { createCliCompositionRoot } from './createCliCompositionRoot';

const logger = console;
const { cliApp } = createCliCompositionRoot({
    getTrezorConnect: () => TrezorConnect,
    getTrezorBlockchain: () => TrezorBlockchain,
    logger,
});

cliApp(process.argv.slice(2))
    .then(exitCode => {
        process.exitCode = exitCode;
    })
    .catch(error => {
        logger.error(error);
        process.exitCode = 1;
    });
