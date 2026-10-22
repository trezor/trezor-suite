import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol, getMainnets } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const ethereum = getCryptoId(ethSymbol);

const ETHEREUM_ADDRESS_3 = '0x574BbB36871bA6b78E27f4B4dCFb76eA0091880B';

const mainnets = getMainnets();
const mainnetSymbols: string[] = mainnets.map(network => network.symbol);
const nativeAssetIds: string[] = mainnets.map(network => getCryptoId(network.symbol));

// Curve sits around rank 300 of roughly 29k catalogue entries, so finding it proves the list
// reaches well past the handful of assets a curated trading list would carry.
const curveOnEthereum = getCryptoId(ethSymbol, '0xd533a949740bb3306d119cc777fa900ba034cd52');

// The tokens Suite users receive most, from product analytics, with the catalogue entry expected on
// every network the asset itself is issued on. Bridged and same-symbol lookalikes are left out: the
// catalogue lists those under their own names, so they are different assets rather than the token on
// another chain. Catalogue rank does not track real usage - HEX is among the most held yet sits near
// the bottom of the ranking - so each one is reached by search, never by position in the list.
const topReceivedTokens = [
    {
        symbol: 'USDT',
        contracts: {
            avax: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
            eth: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            sol: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            trx: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        },
    },
    {
        symbol: 'USDC',
        contracts: {
            arb: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
            arc: '0x3600000000000000000000000000000000000000',
            avax: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
            base: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            eth: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            hype: '0xb88339cb7199b77e23db6e890353e22632ba630f',
            op: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
            pol: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            sol: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            trx: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
            xlm: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        },
    },
    {
        symbol: 'WETH',
        contracts: {
            eth: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            trx: 'THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF',
        },
    },
    {
        symbol: 'LINK',
        contracts: {
            arb: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4',
            arc: '0x76a443768a5e3b8d1aed0105fc250877841deb40',
            avax: '0x5947bb275c521040051d82396192181b413227a3',
            base: '0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196',
            bsc: '0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd',
            eth: '0x514910771af9ca656af840dff83e8264ecf986ca',
            hype: '0x1ac2ee68b8d038c982c1e1f73f596927dd70de59',
            op: '0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6',
            pol: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39',
            rhc: '0x492641f648a4986844848e0befe66d14817bce34',
            sol: 'LinkhB3afbBKb2EQQu7s7umdZceV3wcvAUJhQAfQ23L',
        },
    },
    {
        symbol: 'ARB',
        contracts: {
            arb: '0x912ce59144191c1204e64559fe8253a0e49e6548',
            eth: '0xb50721bcf8d664c30412cfbc6cf7a15145234ad1',
        },
    },
    {
        symbol: 'YF-DAI',
        contracts: {
            arb: '0xf061956612b3dc79fd285d3d51bc128f2ea87740',
            eth: '0xf4cd3d3fda8d7fd6c5a500203e38640a70bf9577',
            pol: '0x7e7ff932fab08a0af569f93ce65e7b8b23698ad8',
        },
    },
    {
        symbol: 'HEX',
        contracts: {
            eth: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
            pol: '0x23d29d30e35c5e8d321e1dc9a8a61bfd846d4c5c',
        },
    },
];

test.describe('Global receive - asset first', { tag: ['@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    // Only Bitcoin is enabled, so Ethereum stays inactive for the network activation tests.
    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: [btcSymbol] });
        await dashboardPage.navigateTo();
    });

    test(
        'User can reach every supported coin in the asset catalogue',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ globalReceiveModal, tradingPage }) => {
            await test.step('Open global receive on the Assets subtab', async () => {
                await globalReceiveModal.open();
                await expect(globalReceiveModal.assetsTab).toHaveAttribute('data-active', 'true');
            });

            // No mnemonic_all mainnet account is funded, so the list renders without the
            // My assets / All assets group labels.

            await test.step('Offer every supported mainnet in the network filter', async () => {
                const filterNetworks =
                    await tradingPage.assetPicker.getSendReceiveNetworkFilterOptions();
                expect(filterNetworks.toSorted()).toEqual(mainnetSymbols.toSorted());
            });

            // Unheld native coins lead the list, ahead of every token, so a short scroll reaches
            // all of them without walking the rest of the catalogue.
            await test.step('List a native coin for every supported mainnet', async () => {
                const foundIds =
                    await globalReceiveModal.collectAssetIdsWhileScrolling(nativeAssetIds);
                expect(foundIds.toSorted()).toEqual(nativeAssetIds.toSorted());
            });

            await test.step('Find a mid-ranked token through search', async () => {
                await tradingPage.assetPicker.searchAsset('CRV');
                await expect(globalReceiveModal.assetOption(curveOnEthereum)).toBeVisible();
            });

            for (const { symbol, contracts } of topReceivedTokens) {
                await test.step(`Offer ${symbol} on every network it is issued on`, async () => {
                    await tradingPage.assetPicker.clearSearch();
                    await tradingPage.assetPicker.searchAsset(symbol);
                    const expectedIds = Object.entries(contracts).map(([network, contract]) =>
                        getCryptoId(asNetworkSymbol(network), contract),
                    );
                    const foundIds =
                        await globalReceiveModal.collectAssetIdsWhileScrolling(expectedIds);
                    expect(foundIds.toSorted()).toEqual(expectedIds.toSorted());
                });
            }

            await test.step('Fall back to the Accounts subtab when nothing matches', async () => {
                await tradingPage.assetPicker.clearSearch();
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
