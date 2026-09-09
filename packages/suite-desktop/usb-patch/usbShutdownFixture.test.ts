import { execFileSync } from 'child_process';
import path from 'path';

const electronPath = require('electron');

describe('USB shutdown', () => {
    it.each(['main', 'utility'])(
        'exits cleanly in the %s process',
        mode => {
            const env = { ...process.env };
            delete env.ELECTRON_RUN_AS_NODE;

            expect(() =>
                execFileSync(
                    electronPath,
                    [
                        '--no-sandbox',
                        '--disable-gpu',
                        '--ozone-platform=headless',
                        path.join(__dirname, 'usbShutdownFixture.cjs'),
                        ...(mode === 'utility' ? ['--utility'] : []),
                    ],
                    {
                        encoding: 'utf8',
                        stdio: 'pipe',
                        timeout: 30_000,
                        env,
                    },
                ),
            ).not.toThrow();
        },
        35_000,
    );
});
