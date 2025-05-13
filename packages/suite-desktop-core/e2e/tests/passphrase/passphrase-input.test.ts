import { expect, test } from '../../support/fixtures';

test.describe('Passphrase input', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('just test passphrase input', async ({ dashboardPage, page }) => {
        // start adding hidden wallet
        dashboardPage.openDeviceSwitcher();
        dashboardPage.addHiddenWalletButton.click();
        await page.getByTestId('@switch-device/add-existing-hidden-wallet-button').click();

        // select whole text and delete it
        await dashboardPage.passphraseInput.pressSequentially('123456');
        await dashboardPage.passphraseInput.clear();
        await dashboardPage.passphraseInput.pressSequentially('1');
        await dashboardPage.passphraseInput.press('Backspace');
        await expect(dashboardPage.passphraseInput).toHaveValue('');

        // leftarrow sets caret to correct position
        await dashboardPage.passphraseInput.pressSequentially('abcdef');
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseInput.pressSequentially('12');
        await dashboardPage.passphraseShowButton.click();
        await expect(dashboardPage.passphraseInput).toHaveValue('abcd12ef');
        await dashboardPage.passphraseShowButton.click();
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseInput.press('Backspace');
        await dashboardPage.passphraseInput.press('Backspace');
        await dashboardPage.passphraseShowButton.click();
        await expect(dashboardPage.passphraseInput).toHaveValue('ab12ef');

        // toggle hidden/visible keeps caret position
        await dashboardPage.passphraseInput.click();
        await dashboardPage.passphraseInput.clear();
        await expect(dashboardPage.passphraseInput).toBeEmpty();
        await dashboardPage.passphraseInput.pressSequentially('1');
        await dashboardPage.passphraseInput.press('Backspace');
        await dashboardPage.passphraseInput.pressSequentially('123');
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseShowButton.click();
        await dashboardPage.passphraseInput.pressSequentially('abc');
        await dashboardPage.passphraseShowButton.click();
        await expect(dashboardPage.passphraseInput).toHaveValue('12abc3');
        await dashboardPage.passphraseShowButton.click();
        await dashboardPage.passphraseInput.press('ArrowRight');
        await dashboardPage.passphraseInput.pressSequentially('xyz');
        await dashboardPage.passphraseShowButton.click();
        await expect(dashboardPage.passphraseInput).toHaveValue('12abc3xyz');

        // when selectionStart===0 (looking at you nullish coalescing)
        await dashboardPage.passphraseInput.clear();
        await dashboardPage.passphraseInput.pressSequentially('123');
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseInput.pressSequentially('abc');
        await expect(dashboardPage.passphraseInput).toHaveValue('abc123');
        await dashboardPage.passphraseInput.clear();
        await dashboardPage.passphraseInput.pressSequentially('123');
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseInput.press('ArrowLeft');
        await dashboardPage.passphraseInput.press('Backspace');
        await dashboardPage.passphraseInput.press('Delete');
        await expect(dashboardPage.passphraseInput).toHaveValue('23');
    });
});
