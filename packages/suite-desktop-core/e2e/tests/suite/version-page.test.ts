import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';

import { expect, test } from '../../support/fixtures';

//TODO: Fix #17001
test.describe.skip('Hidden version page', { tag: ['@group=suite', '@webOnly'] }, () => {
    test.beforeEach(async ({ trezorUserEnvLink }) => {
        await trezorUserEnvLink.stopEmu();
        await trezorUserEnvLink.stopBridge();
    });
    test.use({ startEmulator: false });

    test('is accessible via route', async ({ url, page }) => {
        const suiteVersion = getSuiteVersion();
        const suiteCommitHash = getCommitHash();
        await page.goto(url + 'version');
        await expect(page.getByTestId('@version/number')).toHaveText(suiteVersion, {
            timeout: 30_000,
        });
        await expect(page.getByTestId('@version/commit-hash-link')).toHaveText(suiteCommitHash);
        const hashLink = await page.getByTestId('@version/commit-hash-link').getAttribute('href');
        expect(hashLink).toContain(
            `https://github.com/trezor/trezor-suite/commits/${suiteCommitHash}`,
        );
    });
});
