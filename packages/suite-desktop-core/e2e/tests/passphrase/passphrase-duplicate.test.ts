import { expect, test } from '../../support/fixtures';

test.describe('Passphrase duplicate', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage, trezorUserEnvLink }) => {
        await trezorUserEnvLink.applySettings({ passphrase_always_on_device: false });
        await onboardingPage.completeOnboarding();
    });

    //TODO: #17161 Fix instable test
    test.skip('attempt to add the same hidden wallet twice results in warning', async ({
        page,
        dashboardPage,
    }) => {
        const passphraseToType = 'taxation is theft';

        // enter passphrase A for the first time
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.addUnusedHiddenWallet(passphraseToType);

        // try to add another wallet with the same passphrase
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.addHiddenWallet(passphraseToType, { skipDiscovery: true });

        // duplicate passphrase modal appears;
        await expect(page.getByTestId('@passphrase-duplicate-header')).toBeVisible();
    });
});
