import { expect, test } from '../../support/fixtures';

test.describe('Passphrase numbering', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('hidden wallet numbering', async ({ dashboardPage }) => {
        const passphraseOne = 'First passphrase';
        const passphraseTwo = 'Second passphrase';
        const passphraseThree = 'Third passphrase';

        await test.step('Add two passphrase wallets', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addUnusedHiddenWallet(passphraseOne);
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addUnusedHiddenWallet(passphraseTwo);
        });

        await test.step('verify wallet labels are correct', async () => {
            await dashboardPage.openDeviceSwitcher();
            await expect(dashboardPage.walletAtIndex(0)).toContainTranslation(
                'TR_NO_PASSPHRASE_WALLET',
            );
            await expect(dashboardPage.walletAtIndex(1)).toContainTranslation(
                'TR_PASSPHRASE_WALLET',
                { values: { id: '1' } },
            );
            await expect(dashboardPage.walletAtIndex(2)).toContainTranslation(
                'TR_PASSPHRASE_WALLET',
                { values: { id: '2' } },
            );
        });

        await test.step('eject standard and the first passphrase wallet', async () => {
            await dashboardPage.ejectWallet();
            await dashboardPage.ejectWallet();
        });

        await test.step('add standard and another passphrase wallet', async () => {
            await dashboardPage.addStandardWallet();
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addUnusedHiddenWallet(passphraseThree);
        });

        await test.step('verify passphrase wallet labels are correct', async () => {
            await dashboardPage.openDeviceSwitcher();
            await expect(dashboardPage.walletAtIndex(0)).toContainTranslation(
                'TR_PASSPHRASE_WALLET',
                { values: { id: '2' } },
            );
            await expect(dashboardPage.walletAtIndex(1)).toContainTranslation(
                'TR_NO_PASSPHRASE_WALLET',
            );
            await expect(dashboardPage.walletAtIndex(2)).toContainTranslation(
                'TR_PASSPHRASE_WALLET',
                { values: { id: '3' } },
            );
        });
    });
});
