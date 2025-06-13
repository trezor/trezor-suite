import { expect, test } from '../../support/fixtures';

test.describe('Bridge page', { tag: ['@group=suite', '@webOnly'] }, () => {
    test.use({ startEmulator: false });
    test('can use webusb', async ({ url, page, analyticsSection }) => {
        await analyticsSection.continueButton.click();

        await page.goto(url + 'bridge');

        // user may exit bridge page and use webusb
        await page.getByTestId('@bridge/goto/wallet-index').click();

        // connect device prompt with webusb enabled appears
        await expect(page.getByTestId('@connect-device-prompt')).toBeVisible();
    });
});
