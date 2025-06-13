import { expect, test } from '../../support/fixtures';

test.describe('Hidden version page', { tag: ['@group=suite', '@webOnly'] }, () => {
    test.use({ startEmulator: false });
    test('is accessible via route', async ({ url, page, analyticsSection }) => {
        await analyticsSection.continueButton.click();

        await page.goto(url + 'version');
        await expect(page.getByTestId('@version/number')).toHaveText(/^\d+.\d+.\d+$/, {
            timeout: 30_000,
        });
        await expect(page.getByTestId('@version/commit-hash-link')).toHaveText(/[a-f0-9]{40}/);
        const hashLink = await page.getByTestId('@version/commit-hash-link').getAttribute('href');
        expect(hashLink).toContain(`https://github.com/trezor/trezor-suite/commits/`);
    });
});
