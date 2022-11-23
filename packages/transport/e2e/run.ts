import { runCLI } from 'jest';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import argv from './jest.config';

(async () => {
    // Before actual tests start, establish connection with trezor-user-env
    await TrezorUserEnvLink.connect();

    // @ts-expect-error
    const { results } = await runCLI(argv, [__dirname]);

    process.exit(results.numFailedTests);
})();
