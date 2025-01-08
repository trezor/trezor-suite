import { test, expect } from '../../support/fixtures';

test.use({ startEmulator: false, browserName: 'firefox' });
test.describe('Firefox', { tag: ['@group=other', '@webOnly'] }, () => {
    test('Suite does support Firefox', async ({ page, onboardingPage }) => {
        await expect(onboardingPage.welcomeTitle).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText('Continue at my own risk')).not.toBeVisible();
    });
});
