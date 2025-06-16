import messages from '@trezor/suite/src/support/messages';

import { expect, test } from '../../support/fixtures';

test.describe('Passphrase duplicate', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage, trezorUserEnvLink }) => {
        await trezorUserEnvLink.applySettings({ passphrase_always_on_device: false });
        await onboardingPage.completeOnboarding();
    });

    test('attempt to add the same hidden wallet twice results in warning', async ({
        page,
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
            await expect(page.getByTestId('@passphrase-duplicate-header')).toBeVisible();
            await expect(page.getByTestId('@passphrase-duplicate-header')).toHaveText(
                messages['TR_WALLET_DUPLICATE_TITLE'].defaultMessage,
            );
            await expect(page.getByTestId('@passphrase-duplicate-description')).toHaveText(
                messages['TR_WALLET_DUPLICATE_DESC'].defaultMessage,
            );
        });
    });
});
