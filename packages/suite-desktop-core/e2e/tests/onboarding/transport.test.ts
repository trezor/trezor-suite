import { expect, test } from '../../support/fixtures';

test.describe.skip(
    'Onboarding - transport webusb/bridge',
    { tag: ['@group=device-management', '@webOnly'] },
    () => {
        test.use({ startEmulator: false });

        test.beforeEach(async ({ trezorUserEnvLink }) => {
            await trezorUserEnvLink.stopBridge();
            await trezorUserEnvLink.stopEmu();
            await trezorUserEnvLink.startBridge();
        });

        test('Offer webusb as primary choice on web', async ({ page, analyticsSection }) => {
            await analyticsSection.continueButton.click();
            await expect(page.getByTestId('@webusb-button')).toBeVisible({ timeout: 30000 });
            await page.getByTestId('@connect-device-prompt/no-device-detected').click();
            await expect(page.getByTestId('@collapsible-box/body')).toHaveAttribute(
                'aria-expanded',
                'true',
            );
        });

        test.afterEach(async ({ trezorUserEnvLink }) => {
            await trezorUserEnvLink.stopBridge();
        });
    },
);
