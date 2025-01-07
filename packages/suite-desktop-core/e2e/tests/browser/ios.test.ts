import { devices } from '@playwright/test';

import { test, expect } from '../../support/fixtures';

const iosAria = `
    - heading "Suite doesn’t work on iOS yet" [level=1]
    - paragraph: "We’re working hard to bring the Trezor Suite mobile web app to iOS. In the meantime, you can use Trezor Suite on the following platforms:"
    - list:
      - listitem: Trezor Suite desktop app
      - listitem: Trezor Suite for web
      - listitem: Mobile web app for Chrome on Android
`;

test.use({ startEmulator: false, browserName: 'chromium', ...devices['iPhone 15 Pro'] });
test.describe('iPhone with Chrome browser', { tag: ['@group=other', '@webOnly'] }, () => {
    test('Suite does not support iOS', async ({ page }) => {
        await expect(
            page.getByRole('heading', { name: 'Suite doesn’t work on iOS yet' }),
        ).toBeVisible();
        await expect(page.locator('body')).toMatchAriaSnapshot(iosAria);
        await expect(page.getByText('Continue at my own risk')).not.toBeVisible();
    });
});
