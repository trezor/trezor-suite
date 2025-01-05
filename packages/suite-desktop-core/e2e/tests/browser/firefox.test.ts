import { test, expect } from '../../support/fixtures';

test.use({ startEmulator: false, browserName: 'firefox' });
test.describe('Firefox', { tag: ['@group=other', '@webOnly'] }, () => {
    test('Suite does support Firefox', async ({ page }) => {
        await expect(page.getByTestId('@welcome/title')).toBeVisible();
        await expect(page.getByText('Continue at my own risk')).not.toBeVisible();
    });
});
