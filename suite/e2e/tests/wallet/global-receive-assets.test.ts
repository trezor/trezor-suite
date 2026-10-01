import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const ethereum = getCryptoId(ethSymbol);

const ETHEREUM_ADDRESS_3 = '0x574BbB36871bA6b78E27f4B4dCFb76eA0091880B';

const USDC_MIN_NETWORKS = 5;

test.describe('Global receive - asset first', { tag: ['@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    // Only Bitcoin is enabled, so Ethereum stays inactive for the network activation tests.
    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: [btcSymbol] });
        await dashboardPage.navigateTo();
    });

    test(
        'User can search the asset catalogue across networks',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ globalReceiveModal, tradingPage }) => {
            await test.step('Open global receive on the Assets subtab', async () => {
                await globalReceiveModal.open();
                await expect(globalReceiveModal.assetsTab).toHaveAttribute('data-active', 'true');
            });

            // No mnemonic_all mainnet account is funded, so the list renders without the
            // My assets / All assets group labels.

            await test.step('Search USDC and find it on several networks', async () => {
                await tradingPage.assetPicker.searchAsset('USDC');
                await expect
                    .poll(
                        async () => (await globalReceiveModal.getRenderedAssetNetworks()).length,
                        'expected USDC to be offered on several networks',
                    )
                    .toBeGreaterThanOrEqual(USDC_MIN_NETWORKS);
            });

            await test.step('Fall back to the Accounts subtab when nothing matches', async () => {
                await tradingPage.assetPicker.searchInput.fill('');
                await tradingPage.assetPicker.searchAsset('notanassetatall');
                await expect(globalReceiveModal.noAssetsResults).toBeVisible();
                await globalReceiveModal.viewAccountsLink.click();
                await expect(globalReceiveModal.accountsTab).toHaveAttribute('data-active', 'true');
                // Following the link clears the search, so every account is listed again.
                await expect(
                    globalReceiveModal.accountOption({
                        accountType: 'normal',
                        accountSymbol: btcSymbol,
                        index: 0,
                    }),
                ).toBeVisible();
            });
        },
    );

    test(
        'User can activate a network by selecting its asset on the Assets subtab',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, globalReceiveModal, tradingPage, walletPage }) => {
            await test.step('Open global receive and filter to the inactive network', async () => {
                await globalReceiveModal.open();
                await tradingPage.assetPicker.filterSendReceiveByNetwork(ethSymbol);
                await expect(
                    tradingPage.assetPicker.selectedNetworkFilterIcon(ethSymbol),
                ).toBeVisible();
            });

            await test.step('Select Ethereum and let the modal set the network up', async () => {
                await globalReceiveModal.assetOption(ethereum).click();
                await page.discoveryShouldFinish();
                // A coin is its own network, so no "<asset> on <network>" suffix is rendered.
                await expect(globalReceiveModal.description).toHaveText('Ethereum');
            });

            await test.step('Go back and find the asset list still filtered', async () => {
                await globalReceiveModal.goBack();
                await expect(globalReceiveModal.assetOption(ethereum)).toBeVisible();
                await expect(
                    tradingPage.assetPicker.selectedNetworkFilterIcon(ethSymbol),
                ).toBeVisible();
            });

            // A non-default account is picked so that landing on account 1 regardless of the
            // selection would fail.
            await test.step('Select the third of the discovered Ethereum accounts', async () => {
                await globalReceiveModal.assetOption(ethereum).click();
                await globalReceiveModal
                    .accountOption({
                        accountType: 'normal',
                        accountSymbol: ethSymbol,
                        index: 2,
                    })
                    .click();
            });

            await test.step('Land on the receive screen of that account', async () => {
                await expect(
                    page.getByTestId("@metadata/accountLabel/m/44'/60'/0'/0/2/hover-container"),
                ).toHaveTranslation('LABELING_ACCOUNT', {
                    values: { networkName: 'Ethereum', index: '3' },
                });
                // The receive screen renders the address itself, and its labeling container is
                // keyed by that address.
                await expect(
                    page.getByTestId(
                        `@metadata/addressLabel/${ETHEREUM_ADDRESS_3}/hover-container`,
                    ),
                ).toBeVisible();
                await expect(walletPage.verifyAddressButton).toBeVisible();
            });
        },
    );

    test(
        'User can add a network account from the Accounts subtab',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, globalReceiveModal, toastSection, walletPage }) => {
            await test.step('Open Add account from the Accounts subtab', async () => {
                await globalReceiveModal.open();
                await globalReceiveModal.accountsTab.click();
                await expect(globalReceiveModal.accountsTab).toHaveAttribute('data-active', 'true');
                await globalReceiveModal.addAccountButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_ADD_ACCOUNT');
            });

            await test.step('Add an Ethereum account', async () => {
                await walletPage.addAccountNetworkSearchInput.fill('eth');
                await walletPage.addAccountNetworkButton(ethSymbol).click();
                await page.discoveryShouldFinish();
            });

            await test.step('Confirm the discovered accounts toast appears', async () => {
                await expect(toastSection.accountsDiscovered).toBeVisible();
            });

            await test.step('Return to Receive and find the new account listed', async () => {
                // The Add account modal stays open after activating a network.
                await page.getByTestId('@modal/back-button').click();
                await expect(page.modalHeader).toHaveTranslation('TR_RECEIVE');
                await expect(
                    globalReceiveModal.accountOption({
                        accountType: 'normal',
                        accountSymbol: ethSymbol,
                        index: 0,
                    }),
                ).toBeVisible();
            });

            await test.step('Select the new account and land on its receive screen', async () => {
                await globalReceiveModal
                    .accountOption({
                        accountType: 'normal',
                        accountSymbol: ethSymbol,
                        index: 0,
                    })
                    .click();
                await expect(walletPage.verifyAddressButton).toBeVisible();
            });
        },
    );
});
