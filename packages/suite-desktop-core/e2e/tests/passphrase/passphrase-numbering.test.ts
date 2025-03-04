import { expect, test } from '../../support/fixtures';

test.describe('Passphrase numbering', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('hidden wallet numbering', async ({ dashboardPage }) => {
        const passphraseOne = 'First passphrase';
        const passphraseTwo = 'Second passphrase';
        const passphraseThree = 'Third passphrase';

        // Add two hidden wallets
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.addUnusedHiddenWallet(passphraseOne);

        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.addUnusedHiddenWallet(passphraseTwo);

        // assert that wallet labels are correct
        await dashboardPage.openDeviceSwitcher();
        await expect(dashboardPage.walletAtIndex(0)).toContainText('Standard wallet');
        await expect(dashboardPage.walletAtIndex(1)).toContainText('Passphrase wallet #1');
        await expect(dashboardPage.walletAtIndex(2)).toContainText('Passphrase wallet #2');

        // eject standard and the first hidden wallet
        await dashboardPage.ejectWallet();
        await dashboardPage.ejectWallet();

        // add standard and another hidden wallet
        await dashboardPage.addStandardWallet();
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.addUnusedHiddenWallet(passphraseThree);

        // assert that wallet labels are correct
        await dashboardPage.openDeviceSwitcher();
        await expect(dashboardPage.walletAtIndex(0)).toContainText('Passphrase wallet #2');
        await expect(dashboardPage.walletAtIndex(1)).toContainText('Standard wallet');
        await expect(dashboardPage.walletAtIndex(2)).toContainText('Passphrase wallet #3');
    });
});
