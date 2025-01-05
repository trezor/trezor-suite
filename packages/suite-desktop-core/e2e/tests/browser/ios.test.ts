import { devices } from '@playwright/test';

import { test, expect } from '../../support/fixtures';

test.use({ startEmulator: false, browserName: 'chromium', ...devices['iPhone 15 Pro'] });
test.describe('iPhone with Chrome browser', { tag: ['@group=other', '@webOnly'] }, () => {
    test('Suite does not support iOS', async ({ page }) => {
        await expect(
            page.getByRole('heading', { name: 'Suite doesn’t work on iOS yet' }),
        ).toBeVisible();
        await expect(page).toHaveScreenshot('iphone-unsupported.png');
        await expect(page.getByText('Continue at my own risk')).not.toBeVisible();
    });
});
