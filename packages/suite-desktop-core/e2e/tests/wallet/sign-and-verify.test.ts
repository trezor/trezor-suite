import { expect, test } from '../../support/fixtures';

const PATH = "m/84'/0'/0'/0/3";
const ADDRESS = 'bc1q6hr68ewf72l6r7cj6ut286x0xkwg5706jq450u';
const MESSAGE = 'hello world';
const SIGNATURE =
    'JxpInbBQH8LYgBBnRt4/QCV+HBW3hL1o1Yg85biWX1DdBTbfN96pyLL7tLQdYn+VtjvuZWJhEYbUCasjZLmih6w=';
const ELECTRUM_SIGNATURE =
    'HxpInbBQH8LYgBBnRt4/QCV+HBW3hL1o1Yg85biWX1DdBTbfN96pyLL7tLQdYn+VtjvuZWJhEYbUCasjZLmih6w=';
test.describe('Sign and verify', { tag: ['@group=wallet'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ page, walletPage, onboardingPage }) => {
        await onboardingPage.completeOnboarding();
        await walletPage.openAccount();
        await page.waitForTimeout(500); // wait until is the dropdown loaded
        await walletPage.walletExtraDropDown.click();
        await walletPage.signAndVerifyButton.click();
    });

    /* Test case
     * 1. Pass onboarding.
     * 2. Navigate to wallet-index.
     * 3. Open sign and verify dialogue.
     * 4. Fill in message to sign
     * 5. Select address
     * 6. Press Sign and confirm on device
     * 7. Compare signature with expected value
     */

    test('Sign', async ({ page, devicePrompt }) => {
        await page.getByTestId('@sign-verify/message').fill(MESSAGE);
        await page.getByTestId('@sign-verify/sign-address/input').click();
        await page.getByTestId(`@sign-verify/sign-address/option/${PATH}`).click();
        await expect(page.getByTestId('@sign-verify/sign-address/input')).toContainText(ADDRESS);
        await page.getByTestId('@sign-verify/submit').click();

        await devicePrompt.waitForPromptAndConfirm(); // Confirm signing address
        await devicePrompt.waitForPromptAndConfirm(); // Confirm message

        await expect(page.getByTestId('@sign-verify/signature')).toHaveValue(SIGNATURE);
    });

    test('Sign Electrum', async ({ page, devicePrompt }) => {
        await page.getByTestId('@sign-verify/message').fill(MESSAGE);
        await page.getByTestId('@sign-verify/sign-address/input').click();
        await page.getByTestId(`@sign-verify/sign-address/option/${PATH}`).click();
        await expect(page.getByTestId('@sign-verify/sign-address/input')).toContainText(ADDRESS);
        await page.getByTestId('@sign-verify/format').click();
        await page.getByTestId('select-bar/true').click();
        await page.getByTestId('@sign-verify/submit').click();
        await devicePrompt.waitForPromptAndConfirm(); // Confirm signing address
        await devicePrompt.waitForPromptAndConfirm(); // Confirm message
        await expect(page.getByTestId('@sign-verify/signature')).toHaveValue(ELECTRUM_SIGNATURE);
    });

    test('Verify', async ({ page, devicePrompt }) => {
        await page.getByTestId('@sign-verify/navigation/verify').click();
        await page.getByTestId('@sign-verify/message').fill(MESSAGE);
        await page.getByTestId('@sign-verify/select-address').fill(ADDRESS);
        await page.getByTestId('@sign-verify/signature').fill(SIGNATURE);
        await page.getByTestId('@sign-verify/submit').click();

        await devicePrompt.waitForPromptAndConfirm(); // Confirm signing address
        await devicePrompt.waitForPromptAndConfirm(); // Confirm message
        await devicePrompt.waitForPromptAndConfirm(); // Confirmation that signature is valid

        await expect(page.getByTestId('@toast/verify-message-success')).toBeVisible();
    });
});
