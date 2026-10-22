import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const regtestSymbol = asNetworkSymbol('regtest');

const REGTEST_ADDRESS = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

test.describe('Global send', { tag: ['@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: [asNetworkSymbol('btc')] });
        await dashboardPage.navigateTo();
    });

    test(
        `Global send`,
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, walletPage, tradingPage, settingsPage, dashboardPage, trezorUserEnv }) => {
            // The send picker only lists accounts with a spendable balance and no mnemonic_all
            // mainnet account is funded, so the test funds a regtest account first.
            await test.step('Fund and enable a regtest account', async () => {
                await trezorUserEnv.sendToAddressAndMineBlock({
                    address: REGTEST_ADDRESS,
                    btc_amount: 1,
                });
                await settingsPage.navigateTo('application');
                await settingsPage.toggleDebugModeInSettings();
                await settingsPage.toggleTestnetNetworks();
                await settingsPage.changeNetworks({ enableNetworks: [regtestSymbol] });
                await dashboardPage.navigateTo();
            });

            await test.step('Open send form', async () => {
                await page.getByTestId('@wallet/menu/wallet-global-send').click();
                await expect(page.modalHeader).toHaveTranslation('TR_NAV_SEND');
            });

            await test.step('Bitcoin Regtest account selection', async () => {
                await tradingPage.assetPicker.filterSendReceiveByNetwork(regtestSymbol);
                await expect(
                    tradingPage.assetPicker.selectedNetworkFilterIcon(regtestSymbol),
                ).toBeVisible();
                await tradingPage.assetPicker
                    .sendOption({
                        accountType: 'normal',
                        accountSymbol: regtestSymbol,
                        index: 0,
                    })
                    .click();
            });

            await test.step('Send form validation', async () => {
                await expect(walletPage.sendFormHeader).toHaveTranslation('TR_NAV_SEND');
                await expect(
                    page.getByTestId("@metadata/accountLabel/m/84'/1'/0'/hover-container"),
                ).toHaveTranslation('LABELING_ACCOUNT', {
                    values: { networkName: 'Bitcoin Regtest', index: '1' },
                });
            });
        },
    );
});
