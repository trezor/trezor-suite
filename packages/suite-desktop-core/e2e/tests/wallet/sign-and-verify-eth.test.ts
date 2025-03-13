import { expect, test } from '../../support/fixtures';

test.describe('Sign and verify ETH', { tag: ['@group=wallet'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ dashboardPage, onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();

        await settingsPage.navigateTo('coins');

        await settingsPage.coins.disableNetwork('btc');
        await settingsPage.coins.enableNetwork('eth');

        await dashboardPage.dashboardMenuButton.click();
        await dashboardPage.discoveryShouldFinish();
    });

    const MESSAGE_SIGN = 'hello world';
    const SIGNATURE_SIGN =
        '0a172eaac00636dbc124c170e5afa7665cdeed65b59449ee1bbb6e57b1cfbf7971a1c88b48cacd17ec585918cd849c36a016e99ecfd757b947c732e7470b9b3d1b';
    const ADDRESS_SIGN = '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8';

    /* Test case
     * 1. Pass onboarding
     * 2. Navigate to settings/coins and Disable BTC and enable ETH
     * 3. Pass discovery
     * 4. Navigate to Sign and verify section
     * 5. Fill out fields and sign message.
     * 6. Check that notification was rendered and correct message was generated
     */
    test('Sign ETH', async ({ page, devicePrompt, walletPage }) => {
        await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
        await walletPage.walletExtraDropDown.click();
        await walletPage.signAndVerifyButton.click();
        await page.getByTestId('@sign-verify/message').fill(MESSAGE_SIGN);
        await page.getByTestId('@sign-verify/submit').click();
        await devicePrompt.waitForPromptAndConfirm(); // Confirm signing address
        await devicePrompt.waitForPromptAndConfirm(); // Confirm message
        await expect(page.getByTestId('@sign-verify/signature')).toHaveValue(SIGNATURE_SIGN);

        await expect(page.getByTestId('@toast/sign-message-success')).toBeVisible();
    });

    /* Test case
     * 1. Pass onboarding
     * 2. Navigate to settings/coins and Disable BTC and enable ETH
     * 3. Pass discovery
     * 4. Navigate to Sign and verify section
     * 5. Go to verify
     * 6. Fill out fields and sign message.
     * 7. Check that notification was rendered and correct message was generated
     */
    test('Verify ETH', async ({ page, devicePrompt, walletPage }) => {
        await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
        await walletPage.walletExtraDropDown.click();
        await walletPage.signAndVerifyButton.click();

        await page.getByTestId('@sign-verify/navigation/verify').click();
        await page.getByTestId('@sign-verify/message').fill(MESSAGE_SIGN);
        await page.getByTestId('@sign-verify/select-address').fill(ADDRESS_SIGN);
        await page.getByTestId('@sign-verify/signature').fill(SIGNATURE_SIGN);
        await page.getByTestId('@sign-verify/submit').click();

        await devicePrompt.waitForPromptAndConfirm(); // Confirm signing address
        await devicePrompt.waitForPromptAndConfirm(); // Confirm message
        await devicePrompt.waitForPromptAndConfirm(); // Confirmation that signature is valid

        await expect(page.getByTestId('@toast/verify-message-success')).toBeVisible();
    });
});
