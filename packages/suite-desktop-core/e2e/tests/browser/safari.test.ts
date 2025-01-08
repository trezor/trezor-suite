import { test, expect } from '../../support/fixtures';

const safariAria = `
    - heading "Your browser is not supported" [level=1]
    - paragraph: We recommend using the Trezor Suite desktop app for the best experience. Alternatively, download a supported browser to use the Trezor Suite web app.
    - link "Desktop App Download":
      - img
      - paragraph: Desktop App
    - link /Chrome \\d+\\+ Download/:
      - img
      - paragraph: /Chrome \\d+\\+/
    - paragraph: Using outdated or unsupported browsers can expose you to security risks. To keep your funds safe, we recommend using the latest version of a supported browser.
    - paragraph: Continue at my own risk
`;

test.use({ startEmulator: false, browserName: 'webkit' });
test.describe('Safari', { tag: ['@group=other', '@webOnly'] }, () => {
    test('Suite does not support Safari', async ({ page, onboardingPage }) => {
        await expect(page.locator('body')).toMatchAriaSnapshot(safariAria);
        await expect(page.getByTestId('@continue-to-suite')).toHaveText('Continue at my own risk');
        await page.getByTestId('@continue-to-suite').click();
        await expect(onboardingPage.welcomeTitle).toBeVisible({ timeout: 20_000 });
    });
});
