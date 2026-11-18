import { HOME_ASSET_ROW_LIMIT } from '@suite-common/assets';
import { AddressFormatter, formatCompactCryptoAmount } from '@suite-common/formatters';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import dump from '../../fixtures/remembered-wallet-db-lite.json';
import { expect, test } from '../../support/fixtures';
import type { IndexedDbDump } from '../../support/indexedDb';
import { createTestAnnotation } from '../../support/reporters/annotations';

const btcSymbol = asNetworkSymbol('btc');
const baseSymbol = asNetworkSymbol('base');
const ethSymbol = asNetworkSymbol('eth');
const arbSymbol = asNetworkSymbol('arb');
const solSymbol = asNetworkSymbol('sol');
const hiddenTokenContract = '0x75a465395Df64FEa66A64D871EE01229e5BF4FDA';
const pepeContract = '0x52b492a33E447Cdb854c7FC19F1e57E8BfA1777D';
const usdcContract = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// USD balance with exactly two decimals, e.g. "$0.00" or "$1,234.56".
const usdBalancePattern = /^\$\s*\d[\d,]*\.\d{2}$/;

// USD price with one or more decimals, e.g. "$64,372.00" or "$0.1234".
const usdPricePattern = /^\$\s*\d[\d,]*\.\d+$/;

// USD change with an optional sign, e.g. "+$12.34", "−$12.34", or "$0.00".
// Accept hyphen-minus (-), minus (−), and en dash (–) used by the UI.
const usdPriceChangePattern = /^[+–−-]?\s*\$\s*\d[\d,]*\.\d+$/;

// Percentage with an optional sign, e.g. "+1.5%", "−13%", "0%", or "≈0%".
const percentageChangePattern = /^(?:[+−-]?\d+(?:\.\d+)?|≈0)\s*%$/;

// Remove the dollar sign, commas, and whitespace (including line breaks) before parsing.
const usdFormattingPattern = /[$,\s]/g;

test.use({ startEmulator: false, setupEmulator: false });

test.describe('Asset home', { tag: ['@noDevice'] }, () => {
    test.beforeEach(async ({ indexedDb, walletPage, dashboardPage, homeAssetsSection }) => {
        await indexedDb.waitForInit();
        await indexedDb.seedFromDump(dump as IndexedDbDump);
        await expect(walletPage.deviceDisconnectedStatus).toBeVisible({ timeout: 20_000 });
        await homeAssetsSection.enableAssetHome();
        await dashboardPage.dashboardMenuButton.click();
    });

    test(
        'User can explore assets and hidden tokens in a view-only wallet',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ dashboardPage, homeAssetsSection, assetDetailPage }) => {
            await test.step('Expand and collapse the asset table', async () => {
                await expect(homeAssetsSection.expandButton).toHaveTranslation('TR_SHOW_MORE');
                await expect(homeAssetsSection.assetRows).toHaveCount(HOME_ASSET_ROW_LIMIT);
                await homeAssetsSection.expandButton.click();
                await expect(homeAssetsSection.expandButton).toHaveTranslation('TR_SHOW_LESS');
                await expect
                    .poll(() => homeAssetsSection.assetRows.count())
                    .toBeGreaterThan(HOME_ASSET_ROW_LIMIT);
                await homeAssetsSection.expandButton.click();
                await expect(homeAssetsSection.expandButton).toHaveTranslation('TR_SHOW_MORE');
                await expect(homeAssetsSection.assetRows).toHaveCount(HOME_ASSET_ROW_LIMIT);
                await homeAssetsSection.expandButton.click();
                await expect(homeAssetsSection.expandButton).toHaveTranslation('TR_SHOW_LESS');
                await expect
                    .poll(() => homeAssetsSection.assetRows.count())
                    .toBeGreaterThan(HOME_ASSET_ROW_LIMIT);
            });

            await test.step('Check the asset home overview', async () => {
                await expect(dashboardPage.assetHome).toBeVisible();
                await expect(homeAssetsSection.totalBalance).toHaveText(usdBalancePattern);
                await expect(homeAssetsSection.bannerTitle).toHaveTranslation(
                    'TR_HOME_ASSET_BANNER_TITLE',
                );
                await expect(homeAssetsSection.bannerDescription).toHaveTranslation(
                    'TR_HOME_ASSET_BANNER_TEXT',
                );
                await expect(dashboardPage.assetHomeTable).toBeVisible();
                await expect(dashboardPage.assetHomeRow(btcSymbol)).toBeVisible();
                await expect(dashboardPage.assetHomeRow(arbSymbol)).toBeHidden();
                await expect(homeAssetsSection.feedbackHeading).toHaveTranslation(
                    'TR_HOME_ASSET_FEEDBACK_TITLE',
                );
            });

            await test.step('Hide small balances and restore them', async () => {
                const smallBalanceToken = homeAssetsSection.assetToken(baseSymbol, pepeContract);
                const higherBalanceToken = homeAssetsSection.assetToken(ethSymbol, usdcContract);
                await expect(smallBalanceToken).toBeVisible();
                await expect(higherBalanceToken).toBeVisible();

                await homeAssetsSection.groupingButton.click();
                await expect(homeAssetsSection.smallBalancesSwitch).toBeChecked();
                await homeAssetsSection.smallBalancesToggle.click();
                await expect(homeAssetsSection.smallBalancesSwitch).not.toBeChecked();
                await expect(smallBalanceToken).toBeHidden();
                await expect(higherBalanceToken).toBeVisible();
                await expect(dashboardPage.assetHomeRow(btcSymbol)).toBeVisible();
                await expect(dashboardPage.assetHomeRow(arbSymbol)).toBeHidden();

                await homeAssetsSection.smallBalancesToggle.click();
                await expect(homeAssetsSection.smallBalancesSwitch).toBeChecked();
                await expect(smallBalanceToken).toBeVisible();
                await expect(higherBalanceToken).toBeVisible();
                await expect(dashboardPage.assetHomeRow(arbSymbol)).toBeHidden();
            });

            await test.step('Group assets by network', async () => {
                await homeAssetsSection.groupByNetworks.click();
                await expect(homeAssetsSection.networkGroup(btcSymbol)).toBeVisible();
                await expect(homeAssetsSection.networkGroup(baseSymbol)).toBeVisible();
                await expect(homeAssetsSection.networkGroup(arbSymbol)).toBeHidden();
                await expect
                    .poll(() => homeAssetsSection.networkAssetNames(ethSymbol).allInnerTexts())
                    .toEqual(expect.arrayContaining(['ETH', 'USDC', 'USDT']));
                await expect
                    .poll(() => homeAssetsSection.networkAssetNames(solSymbol).allInnerTexts())
                    .toEqual(expect.arrayContaining(['SOL', 'USDT']));
            });

            await test.step('Cancel unhiding AVAI on Base and verify it stays unrecognized', async () => {
                await homeAssetsSection.groupingButton.click();
                await homeAssetsSection.hiddenTokensButton.click();
                const avaiRow = homeAssetsSection.hiddenToken(baseSymbol, hiddenTokenContract);
                await avaiRow.click();
                await assetDetailPage.menuButton.click();
                await expect(assetDetailPage.menuNetwork).toContainText('Base');
                await expect(assetDetailPage.menuContract).toHaveText(
                    AddressFormatter.format(hiddenTokenContract, {
                        format: 'long',
                        isChunked: false,
                    }),
                );
                await assetDetailPage.menuShowToken.click();
                await expect(assetDetailPage.unhideModal).toContainTranslation(
                    'TR_HOME_ASSET_UNHIDE_UNRECOGNIZED_TEXT',
                );
                await assetDetailPage.cancelUnhide.click();
                await assetDetailPage.backButton.click();
                await expect(avaiRow).toBeVisible();
            });

            await test.step('Return to the asset home overview', async () => {
                await homeAssetsSection.backButton.click();
                if (await homeAssetsSection.expandButton.isVisible()) {
                    await homeAssetsSection.expandButton.click();
                }
                await expect(dashboardPage.assetHome).toBeVisible();
                await expect(dashboardPage.assetHomeTable).toBeVisible();
                await expect(homeAssetsSection.networkGroup(btcSymbol)).toBeVisible();
            });
        },
    );

    test(
        'User can view USDC on Ethereum and hide it from Home',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ homeAssetsSection, assetDetailPage }) => {
            await homeAssetsSection.expandButton.click();
            const usdcRow = homeAssetsSection.assetToken(ethSymbol, usdcContract);
            const homeBalance = homeAssetsSection.assetFiatBalance(ethSymbol, usdcContract);
            await expect(homeBalance).toHaveText(usdBalancePattern);
            const expectedFiatBalance = await homeBalance.innerText();

            await usdcRow.click();
            await expect(assetDetailPage.fiatBalance).toHaveText(expectedFiatBalance);
            await assetDetailPage.menuButton.click();
            await expect(assetDetailPage.menuNetwork).toContainText('Ethereum');
            await expect(assetDetailPage.menuContract).toHaveText(
                AddressFormatter.format(usdcContract, { format: 'long', isChunked: false }),
            );
            await assetDetailPage.menuHideToken.click();

            await assetDetailPage.backButton.click();
            await homeAssetsSection.expandButton.click();
            await expect(homeAssetsSection.expandButton).toHaveTranslation('TR_SHOW_LESS');
            await expect(usdcRow).toHaveCount(0);
            await homeAssetsSection.groupingButton.click();
            await homeAssetsSection.hiddenTokensButton.click();
            await expect(
                homeAssetsSection.manuallyHiddenToken(ethSymbol, usdcContract),
            ).toBeVisible();
        },
    );

    test(
        'User can explore Ethereum asset detail and its account actions',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, dashboardPage, homeAssetsSection, assetDetailPage, walletPage }) => {
            const homeApyBadge = dashboardPage
                .assetHomeRow(ethSymbol)
                .getByTestId('@earn/yield-badge');
            const apyNumber = /\d+(?:\.\d+)?/;
            await expect(homeApyBadge).toHaveTranslation('TR_EARN_YIELD_BADGE_UP_TO_RATE', {
                values: { apy: apyNumber },
            });
            const homeApy = (await homeApyBadge.innerText()).replace(/[^\d.]/g, '');

            await test.step('Open Ethereum detail with the same balance as Home', async () => {
                await expect(homeAssetsSection.assetFiatBalance(ethSymbol)).toHaveText(
                    usdBalancePattern,
                );
                const homeFiatBalance = await homeAssetsSection
                    .assetFiatBalance(ethSymbol)
                    .innerText();
                const homeCryptoBalance = await homeAssetsSection
                    .assetCryptoBalance(ethSymbol)
                    .innerText();

                await dashboardPage.assetHomeRow(ethSymbol).click();
                await expect(assetDetailPage.fiatBalance).toHaveText(homeFiatBalance);
                // Home rounds the ETH balance; detail shows more decimal places.
                await expect
                    .poll(async () => {
                        const detailCryptoBalance = await assetDetailPage.cryptoBalance.innerText();
                        const balanceWithoutSeparators = detailCryptoBalance.replaceAll(',', '');

                        return formatCompactCryptoAmount({
                            value: balanceWithoutSeparators,
                            locale: 'en-US',
                        });
                    })
                    .toBe(homeCryptoBalance);
            });

            const firstAccountName = await walletPage
                .accountLabel({ symbol: ethSymbol, atIndex: 0 })
                .innerText();
            const thirdAccountName = await walletPage
                .accountLabel({ symbol: ethSymbol, atIndex: 2 })
                .innerText();

            await test.step('Show only Ethereum #1 and #3 in the balance modal', async () => {
                await expect(assetDetailPage.balanceAccountsButton).toHaveTranslation(
                    'TR_ACCOUNT_COUNT',
                    { values: { count: 2 } },
                );
                await assetDetailPage.balanceAccountsButton.click();
                await expect(assetDetailPage.accountRows).toHaveCount(2);
                await expect(
                    assetDetailPage
                        .account('normal', 0)
                        .getByText(firstAccountName, { exact: true }),
                ).toBeVisible();
                await expect(
                    assetDetailPage
                        .account('normal', 2)
                        .getByText(thirdAccountName, { exact: true }),
                ).toBeVisible();
                await page.modalCloseButton.click();
            });

            await test.step('Show the entire ETH balance as available and zero staked', async () => {
                const fiatBalance = await assetDetailPage.fiatBalance.innerText();
                await expect(assetDetailPage.availableRow).toContainTranslation(
                    'TR_STAKE_AVAILABLE',
                );
                await expect(
                    assetDetailPage.availableRow.getByText(fiatBalance, { exact: true }),
                ).toBeVisible();
                await expect(assetDetailPage.stakedRow).toContainTranslation('TR_STAKE_STAKED');
                await expect(
                    assetDetailPage.stakedRow.getByText('$0.00', { exact: true }),
                ).toBeVisible();
                await assetDetailPage.expectAvailableSegmentToFillBar();
            });

            await test.step('Show the staking APY and the same earn offer as Home', async () => {
                await expect(assetDetailPage.stakingApy).toBeVisible();
                await expect(assetDetailPage.stakingApy).toHaveTranslation(
                    'TR_EARN_YIELD_BADGE_RATE',
                    {
                        values: { apy: apyNumber },
                    },
                );
                // Home and the banner offer the higher of the staking and vault rates.
                const stakingApy = parseFloat(await assetDetailPage.stakingApy.innerText());
                expect(stakingApy).toBeLessThanOrEqual(Number(homeApy));
                await expect(assetDetailPage.earnBannerHeading).toBeVisible();
                await expect(assetDetailPage.earnBannerHeading).toHaveTranslation(
                    'TR_STAKING_BANNER_ETH_EARN_TITLE',
                    { values: { apy: homeApy, displaySymbol: 'ETH' } },
                );
            });

            await test.step('Show a positive Ethereum market price', async () => {
                await expect(assetDetailPage.marketPrice).toBeVisible();
                await expect(assetDetailPage.marketPrice).toHaveText(usdPricePattern);
                await expect
                    .poll(async () => {
                        const marketPriceText = await assetDetailPage.marketPrice.innerText();
                        const priceWithoutFormatting = marketPriceText.replace(
                            usdFormattingPattern,
                            '',
                        );
                        const marketPriceNumber = Number(priceWithoutFormatting);

                        return marketPriceNumber;
                    })
                    .toBeGreaterThan(0);
            });

            await test.step('Show numeric seven-day price and percentage changes', async () => {
                // Changes may be positive, negative, or zero; tiny percentages display as ≈0%.
                await expect(assetDetailPage.weekChangeAmount).toBeVisible();
                await expect(assetDetailPage.weekChangeAmount).toHaveText(usdPriceChangePattern);
                await expect(assetDetailPage.weekChangePercentage).toBeVisible();
                await expect(assetDetailPage.weekChangePercentage).toHaveText(
                    percentageChangePattern,
                );
            });

            await test.step('Render the price graph for every time range', async () => {
                await assetDetailPage.expectGraphRendered();
                await assetDetailPage.expectGraphTimeSpan(6.5, 7.5);

                // The outermost price samples can fall just inside the selected period.
                const ranges = [
                    { range: '1d', minDays: 0.9, maxDays: 1.1 },
                    { range: '1m', minDays: 29, maxDays: 31 },
                    { range: '6m', minDays: 178, maxDays: 182 },
                    { range: '1y', minDays: 362, maxDays: 368 },
                    // Ethereum's full price history extends well beyond one year.
                    { range: 'all', minDays: 730 },
                    { range: '1w', minDays: 6.5, maxDays: 7.5 },
                ];
                for (const { range, minDays, maxDays } of ranges) {
                    await assetDetailPage.graphRange(range).click();
                    await assetDetailPage.expectGraphTimeSpan(minDays, maxDays);
                    await assetDetailPage.expectGraphRendered();
                }
            });

            await test.step('Show transactions from multiple Ethereum accounts', async () => {
                await expect
                    .poll(() => assetDetailPage.transactionAccounts.allInnerTexts())
                    .toEqual(expect.arrayContaining([firstAccountName, thirdAccountName]));
            });

            await test.step('Open the Ethereum actions menu', async () => {
                await assetDetailPage.menuButton.click();
                await expect(assetDetailPage.menuNetwork).toContainTranslation('TR_NETWORK_TITLE');
                await expect(assetDetailPage.menuNetwork).toContainText('Ethereum');
                await expect(assetDetailPage.menuAccounts).toContainTranslation(
                    'TR_ASSET_DETAIL_ACCOUNTS',
                );
                await expect(assetDetailPage.menuSignVerify).toHaveTranslation(
                    'TR_NAV_SIGN_AND_VERIFY',
                );
                await expect(assetDetailPage.menuExplorer).toHaveTranslation('TR_VIEW_IN_EXPLORER');
                await expect(assetDetailPage.menuWalletConnect).toHaveTranslation(
                    'TR_WALLETCONNECT',
                );
                await expect(assetDetailPage.menuHideToken).toBeHidden();
                await expect(assetDetailPage.menuShowToken).toBeHidden();
                await assetDetailPage.menuAccounts.click();
                await expect(assetDetailPage.account('normal', 2)).toBeVisible();
                await page.modalCloseButton.click();
            });

            await test.step('Open Receive for Ethereum accounts', async () => {
                await assetDetailPage.receiveButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_NAV_RECEIVE');
                for (const index of [0, 1, 2]) {
                    await expect(
                        walletPage.assetPicker.receiveOption({
                            accountSymbol: ethSymbol,
                            accountType: 'normal',
                            index,
                        }),
                    ).toBeVisible();
                }
                await page.modalCloseButton.click();
            });

            await test.step('Open the Send form for Ethereum #3', async () => {
                await assetDetailPage.sendButton.click();
                await walletPage.assetPicker
                    .sendOption({ accountSymbol: ethSymbol, accountType: 'normal', index: 2 })
                    .click();
                await expect(walletPage.sendForm).toBeVisible();
                await expect(walletPage.sendFormHeader).toHaveTranslation('TR_NAV_SEND');
                await expect(walletPage.accountHeading(thirdAccountName)).toBeVisible();
            });

            await test.step('Return from Ethereum detail to Home', async () => {
                await dashboardPage.dashboardMenuButton.click();
                await dashboardPage.assetHomeRow(ethSymbol).click();
                await assetDetailPage.backButton.click();
                await expect(dashboardPage.assetHomeTable).toBeVisible();
                await expect(dashboardPage.assetHomeRow(ethSymbol)).toBeVisible();
            });
        },
    );
});
