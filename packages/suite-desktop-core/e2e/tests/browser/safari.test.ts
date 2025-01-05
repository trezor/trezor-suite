import { test, expect } from '../../support/fixtures';

test.use({ startEmulator: false, browserName: 'webkit' });
test.describe('Safari', { tag: ['@group=other', '@webOnly'] }, () => {
    test('Suite does not support Safari', async ({ page }) => {
        await expect(
            page.getByRole('heading', { name: 'Your browser is not supported' }),
        ).toBeVisible();
        await expect(page.getByRole('link', { name: 'Desktop App Download' })).toBeVisible();
        await expect(page.getByRole('link', { name: /Chrome \d+\+? Download/ })).toBeVisible();
        await expect(page).toHaveScreenshot('safari-unsupported.png', {
            mask: [page.getByText(/Chrome \d+\+?/)],
        });
        await expect(page.getByTestId('@continue-to-suite')).toHaveText('Continue at my own risk');
        await page.getByTestId('@continue-to-suite').click();
        await expect(page.getByTestId('@welcome/title')).toBeVisible();
    });
});
