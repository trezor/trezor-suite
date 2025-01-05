import { test, expect } from '../../support/fixtures';

test.use({ emulatorStartConf: { wipe: true }, browserName: 'webkit' });
test.describe('Safari', { tag: ['@group=other', '@webOnly'] }, () => {
    test('Should display unsupported browsers page', async ({ page }) => {
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
