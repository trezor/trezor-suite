import TrezorConnect from '@trezor/connect';

import { createCliCompositionRoot } from './createCliCompositionRoot';

const { cliApp } = createCliCompositionRoot({ getTrezorConnect: () => TrezorConnect });

cliApp(process.argv.slice(2))
    .then(exitCode => {
        process.exitCode = exitCode;
    })
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
