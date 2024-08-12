import { runCLI } from 'jest';
import { Config } from '@jest/types';

import { controller as TrezorUserEnvLink } from './controller';
import { config } from './jest.config';

(async () => {
    // Before actual tests start, establish connection with trezor-user-env
    await TrezorUserEnvLink.connect();

    // @ts-expect-error
    const argv: Config.Argv = {
        ...config,
        runInBand: true,
        testPathPattern: [process.argv[2] || ''],
    };

    const { results } = await runCLI(argv, [__dirname]);

    process.exit(results.numFailedTests);
})();
