import { devices } from '@playwright/test';

import { expect, test } from '../../support/fixtures';

const iosAria = `
    - heading "Trezor Suite web doesn’t support iOS" [level=1]
    - paragraph: "If you have a Trezor Safe 7, connect it via Bluetooth using the Trezor Suite desktop app. You can also use Trezor Suite on the following platforms:"
    - list:
      - listitem: Trezor Suite desktop app
      - listitem: Trezor Suite for web
      - listitem: Mobile web app for Chrome on Android
`;

test.use({ startEmulator: false, browserName: 'chromium', ...devices['iPhone 15 Pro'] });
test.describe('iPhone with Chrome browser', { tag: ['@webOnly', '@noDevice'] }, () => {
    test('Suite does not support iOS', async ({ page }) => {
        await expect(
            page.getByRole('heading', { name: 'Trezor Suite web doesn’t support iOS' }),
        ).toBeVisible();
        await expect(page.locator('body')).toMatchAriaSnapshot(iosAria);
        await expect(page.getByText('Continue at my own risk')).toBeHidden();
    });
});
