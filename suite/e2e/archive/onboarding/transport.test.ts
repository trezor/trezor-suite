import { expect, test } from '../../support/fixtures';

test.describe.skip(
    'Onboarding - transport webusb/bridge',
    { tag: ['@webOnly', '@noDevice'] },
    () => {
        test.use({ startEmulator: false });
        test('Offer webusb as primary choice on web', async ({ page, analyticsSection }) => {
            await analyticsSection.continueButton.click();
            await expect(page.getByTestId('@webusb-button')).toBeVisible({ timeout: 30000 });
            await page.getByTestId('@connect-device-prompt/no-device-detected').click();
            await expect(page.getByTestId('@collapsible-box/body')).toHaveAttribute(
                'aria-expanded',
                'true',
            );
        });
    },
);
