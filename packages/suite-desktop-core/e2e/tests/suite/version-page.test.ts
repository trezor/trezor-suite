import { getSuiteVersion } from '@trezor/env-utils';

import { expect, test } from '../../support/fixtures';

test.describe('Hidden version page', { tag: ['@group=suite', '@webOnly'] }, () => {
    test.beforeEach(async ({ trezorUserEnvLink }) => {
        await trezorUserEnvLink.stopEmu();
        await trezorUserEnvLink.stopBridge();
    });
    test.use({ startEmulator: false });

    test('is accessible via route', async ({ url, page }) => {
        const suiteVersion = getSuiteVersion();
        await page.goto(url + 'version');
        await expect(page.getByTestId('@version/number')).toContainText(suiteVersion);
        await page.getByTestId('@modal/version').screenshot({ path: 'version-modal.png' });
    });
});
