import { expect, test } from '../../support/fixtures';

test.describe('Passphrase input', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('just test passphrase input', async ({ dashboardPage, page }) => {
        await test.step('Add passphrase wallet', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addHiddenWalletButton.click();
            await page.getByTestId('@switch-device/add-existing-hidden-wallet-button').click();
        });

        await test.step('test clear input and backspace functionality', async () => {
            await dashboardPage.passphraseInput.pressSequentially('123456');
            await dashboardPage.passphraseInput.clear();
            await dashboardPage.passphraseInput.pressSequentially('1');
            await dashboardPage.passphraseInput.press('Backspace');
            await expect(dashboardPage.passphraseInput).toHaveValue('');
        });

        await test.step('test leftarrow sets caret to correct position', async () => {
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
        });

        await test.step('toggle hidden/visible keeps caret position', async () => {
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
        });

        await test.step('test when selectionStart===0 (nullish coalescing case)', async () => {
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
});
