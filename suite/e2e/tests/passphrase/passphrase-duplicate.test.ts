import { scheduleAction } from '@trezor/utils';

import { expect, test } from '../../support/fixtures';

test.describe('Passphrase duplicate', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ emulatorSetupConf: { passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage, trezorUserEnvLink }) => {
        await scheduleAction(
            () => trezorUserEnvLink.applySettings({ passphrase_always_on_device: false }),
            { timeout: 30_000 },
        );
        await onboardingPage.completeOnboarding();
    });

    test('attempt to add the same hidden wallet twice results in warning', async ({
        dashboardPage,
    }) => {
        const passphraseToType = 'taxation is theft';

        await test.step('Add first passphrase wallet', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addUnusedHiddenWallet(passphraseToType);
        });

        await test.step('Attempt to add another wallet with the same passphrase', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addHiddenWallet(passphraseToType, { skipDiscovery: true });
            await expect(dashboardPage.passphraseDuplicateHeader).toBeVisible();
            await expect(dashboardPage.passphraseDuplicateHeader).toHaveTranslation(
                'TR_WALLET_DUPLICATE_TITLE',
            );
            await expect(dashboardPage.passphraseDuplicateDesc).toHaveTranslation(
                'TR_WALLET_DUPLICATE_DESC',
            );
        });
    });
});
