import { devices } from '@playwright/test';

import { test, expect } from '../../support/fixtures';

test.use({ emulatorStartConf: { wipe: true }, ...devices['iPhone 15 Pro'] });
test.describe('iPhone with Safari browser', { tag: ['@group=other', '@webOnly'] }, () => {
    test('There is no way to connect trezor to iPhone at the moment', async ({ page }) => {
        await expect(
            page.getByRole('heading', { name: 'Suite doesn’t work on iOS yet' }),
        ).toBeVisible();
        await expect(page.getByText('Trezor Suite desktop app')).toBeVisible();
        await expect(page.getByText('Trezor Suite for web')).toBeVisible();
        await expect(page.getByText('Mobile web app for Chrome on Android')).toBeVisible();
        //TODO:  #16073 add visual regression test
        await expect(page.getByText('Continue at my own risk')).not.toBeVisible();
    });
});
