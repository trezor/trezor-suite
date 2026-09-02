import { expect, test } from '../../support/fixtures';

const PATH = "m/84'/0'/0'/0/3";
const ADDRESS = 'bc1q6hr68ewf72l6r7cj6ut286x0xkwg5706jq450u';
const MESSAGE = 'hello world';
const SIGNATURE =
    'JxpInbBQH8LYgBBnRt4/QCV+HBW3hL1o1Yg85biWX1DdBTbfN96pyLL7tLQdYn+VtjvuZWJhEYbUCasjZLmih6w=';
const ELECTRUM_SIGNATURE =
    'HxpInbBQH8LYgBBnRt4/QCV+HBW3hL1o1Yg85biWX1DdBTbfN96pyLL7tLQdYn+VtjvuZWJhEYbUCasjZLmih6w=';

test.describe('Sign and verify', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: { mnemonic: 'mnemonic_all' },
        webClipboardRead: true,
    });

    test.beforeEach(async ({ page, walletPage, onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
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

    test('Signs message with standard Bitcoin signature format', async ({
        page,
        devicePrompt,
        clipboard,
    }) => {
        await page.getByTestId('@sign-verify/message').fill(MESSAGE);
        await page.getByTestId('@sign-verify/sign-address/input').click();
        await page.getByTestId(`@sign-verify/sign-address/option/${PATH}`).click();
        // The selected address is rendered truncated + chunked (e.g. "/3bc1q 6hr6 … jq45 0u"),
        // so match its non-elided beginning after stripping whitespace.
        await expect
            .poll(async () =>
                (await page.getByTestId('@sign-verify/sign-address/input').innerText()).replace(
                    /\s/g,
                    '',
                ),
            )
            .toContain(ADDRESS.slice(0, 8));
        await page.getByTestId('@sign-verify/submit').click();

        await devicePrompt.waitForPromptAndConfirm(); // Confirm signing address
        await devicePrompt.waitForPromptAndConfirm(); // Confirm message

        await expect(page.getByTestId('@sign-verify/signature')).toHaveValue(SIGNATURE);
        await expect(page.getByTestId('@sign-verify/outcome/signed')).toBeVisible();
        await expect(page.getByTestId('@sign-verify/clear')).toBeVisible();

        await page.getByTestId('@sign-verify/copy-address').click();
        await clipboard.expectText(ADDRESS);
        await expect(page.getByTestId('@toast/copy-to-clipboard')).toBeVisible();

        await page.getByTestId('@sign-verify/copy-message').click();
        await clipboard.expectText(MESSAGE);

        await page.getByTestId('@sign-verify/copy-signature').click();
        await clipboard.expectText(SIGNATURE);

        await page.getByTestId('@sign-verify/clear').click();
        await expect(page.getByTestId('@sign-verify/outcome/signed')).toBeHidden();
        await expect(page.getByTestId('@sign-verify/clear')).toBeHidden();
        await expect(page.getByTestId('@sign-verify/submit')).toBeVisible();
        await expect(page.getByTestId('@sign-verify/submitted-address')).toBeHidden();
        await expect(page.getByTestId('@sign-verify/sign-address/input')).toBeVisible();
        await expect(page.getByTestId('@sign-verify/message')).toHaveValue('');
        await expect(page.getByTestId('@sign-verify/signature')).toHaveValue('');
        await expect(page.getByTestId('@sign-verify/copy-address')).toBeHidden();
        await expect(page.getByTestId('@sign-verify/copy-message')).toBeHidden();
        await expect(page.getByTestId('@sign-verify/copy-signature')).toBeHidden();
    });

    test('Signs message with Electrum-compatible signature format', async ({
        page,
        devicePrompt,
        clipboard,
    }) => {
        await page.getByTestId('@sign-verify/message').fill(MESSAGE);
        await page.getByTestId('@sign-verify/sign-address/input').click();
        await page.getByTestId(`@sign-verify/sign-address/option/${PATH}`).click();
        // The selected address is rendered truncated + chunked (e.g. "/3bc1q 6hr6 … jq45 0u"),
        // so match its non-elided beginning after stripping whitespace.
        await expect
            .poll(async () =>
                (await page.getByTestId('@sign-verify/sign-address/input').innerText()).replace(
                    /\s/g,
                    '',
                ),
            )
            .toContain(ADDRESS.slice(0, 8));
        await page.getByTestId('@sign-verify/format').click();
        await page.getByTestId('@sign-verify/format/true').click();
        await page.getByTestId('@sign-verify/submit').click();
        await devicePrompt.waitForPromptAndConfirm(); // Confirm signing address
        await devicePrompt.waitForPromptAndConfirm(); // Confirm message
        await expect(page.getByTestId('@sign-verify/signature')).toHaveValue(ELECTRUM_SIGNATURE);

        // Regression guard for #20504.
        await page.getByTestId('@sign-verify/copy-signature').click();
        await clipboard.expectText(ELECTRUM_SIGNATURE);
    });

    test('Verify message signed with standard Bitcoin signature format', async ({
        page,
        devicePrompt,
    }) => {
        await page.getByTestId('@sign-verify/navigation/verify').click();
        await page.getByTestId('@sign-verify/message').fill(MESSAGE);
        await page.getByTestId('@sign-verify/select-address').fill(ADDRESS);
        await page.getByTestId('@sign-verify/signature').fill(SIGNATURE);
        await page.getByTestId('@sign-verify/submit').click();

        await devicePrompt.waitForPromptAndConfirm(); // Confirm signing address
        await devicePrompt.waitForPromptAndConfirm(); // Confirm message
        await devicePrompt.waitForPromptAndConfirm(); // Confirmation that signature is valid

        await expect(page.getByTestId('@toast/verify-message-success')).toBeVisible();
        await expect(page.getByTestId('@sign-verify/outcome/verified')).toBeVisible();
    });

    test.describe('Altered message', () => {
        test.use({ ignoreToastErrors: ['Message verification error'] });

        test('Verify fails when the message does not match the signature', async ({ page }) => {
            await page.getByTestId('@sign-verify/navigation/verify').click();
            await page.getByTestId('@sign-verify/message').fill(`${MESSAGE}!`);
            await page.getByTestId('@sign-verify/select-address').fill(ADDRESS);
            await page.getByTestId('@sign-verify/signature').fill(SIGNATURE);
            await page.getByTestId('@sign-verify/submit').click();

            await expect(page.getByTestId('@sign-verify/outcome/failed')).toHaveTranslation(
                'TR_VERIFICATION_FAILED_BADGE',
            );
            await expect(page.getByTestId('@toast/verify-message-error')).toBeVisible();
            await expect(page.getByTestId('@sign-verify/outcome/verified')).toBeHidden();
            await expect(page.getByTestId('@toast/verify-message-success')).toBeHidden();
            await expect(page.getByTestId('@sign-verify/submit')).toBeVisible();
            await expect(page.getByTestId('@sign-verify/clear')).toBeHidden();
        });
    });
});
