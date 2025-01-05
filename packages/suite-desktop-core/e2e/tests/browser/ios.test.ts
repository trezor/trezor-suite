import { devices } from '@playwright/test';

import { test, expect } from '../../support/fixtures';

test.use({
    emulatorStartConf: { wipe: true },
    browserName: 'chromium',
    ...devices['iPhone 15 Pro'],
});
test.describe('iPhone with Chrome browser', { tag: ['@group=other', '@webOnly'] }, () => {
    test('There is no way to connect trezor to iPhone at the moment', async ({ page }) => {
        await expect(
            page.getByRole('heading', { name: 'Suite doesn’t work on iOS yet' }),
        ).toBeVisible();
        await expect(page).toHaveScreenshot('iphone-unsupported.png');
        await expect(page.getByText('Continue at my own risk')).not.toBeVisible();
    });
});
