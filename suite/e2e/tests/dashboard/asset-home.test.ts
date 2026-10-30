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

test.use({ startEmulator: false, setupEmulator: false });

test.describe('Asset home', { tag: ['@noDevice'] }, () => {
    test(
        'User can explore assets and cancel unhiding a token in a view-only wallet',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ indexedDb, walletPage, dashboardPage, homeAssetsSection }) => {
            await test.step('Load the view-only wallet and open asset home', async () => {
                await indexedDb.waitForInit();
                await indexedDb.seedFromDump(dump as IndexedDbDump);
                await expect(walletPage.deviceDisconnectedStatus).toBeVisible({ timeout: 20_000 });
                await homeAssetsSection.enableAssetHome();
                await dashboardPage.dashboardMenuButton.click();
            });

            await test.step('Check the asset home overview', async () => {
                await expect(dashboardPage.assetHome).toBeVisible();
                await expect(homeAssetsSection.totalBalance).toBeVisible();
                await expect(homeAssetsSection.banner).toBeVisible();
                await expect(dashboardPage.assetHomeTable).toBeVisible();
                await expect(dashboardPage.assetHomeRow(btcSymbol)).toBeVisible();
                await expect(homeAssetsSection.feedbackHeading).toHaveTranslation(
                    'TR_HOME_ASSET_FEEDBACK_TITLE',
                );
            });

            await test.step('Expand and collapse the asset table', async () => {
                await expect(homeAssetsSection.expandButton).toHaveTranslation('TR_SHOW_MORE');
                await expect(dashboardPage.assetHomeRow(arbSymbol)).toBeHidden();
                const foldedAssetCount = await homeAssetsSection.assetRows.count();
                await homeAssetsSection.expandButton.click();
                await expect(homeAssetsSection.expandButton).toHaveTranslation('TR_SHOW_LESS');
                await expect
                    .poll(() => homeAssetsSection.assetRows.count())
                    .toBeGreaterThan(foldedAssetCount);
                await expect(dashboardPage.assetHomeRow(arbSymbol)).toBeVisible();

                await homeAssetsSection.expandButton.click();
                await expect(homeAssetsSection.expandButton).toHaveTranslation('TR_SHOW_MORE');
                await expect(dashboardPage.assetHomeRow(arbSymbol)).toBeHidden();
                await expect(homeAssetsSection.assetRows).toHaveCount(foldedAssetCount);
            });

            await test.step('Hide small balances in the collapsed table and restore them', async () => {
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
                await expect(homeAssetsSection.expandButton).toBeHidden();

                await homeAssetsSection.smallBalancesToggle.click();
                await expect(homeAssetsSection.smallBalancesSwitch).toBeChecked();
                await expect(smallBalanceToken).toBeVisible();
                await expect(higherBalanceToken).toBeVisible();
                await expect(dashboardPage.assetHomeRow(arbSymbol)).toBeVisible();
                await expect(homeAssetsSection.expandButton).toHaveTranslation('TR_SHOW_LESS');
            });

            await test.step('Group assets by network', async () => {
                await homeAssetsSection.groupByNetworks.click();
                await expect(homeAssetsSection.networkGroup(btcSymbol)).toBeVisible();
                await expect(homeAssetsSection.networkGroup(baseSymbol)).toBeVisible();
                await expect(homeAssetsSection.networkAssetNames(ethSymbol)).toHaveText([
                    'ETH',
                    'USDC',
                    'USDT',
                ]);
                await expect(homeAssetsSection.networkAssetNames(solSymbol)).toHaveText([
                    'SOL',
                    'USDT',
                ]);
            });

            await test.step('Cancel unhiding an unrecognized token', async () => {
                await homeAssetsSection.groupingButton.click();
                await homeAssetsSection.hiddenTokensButton.click();
                await expect(homeAssetsSection.unrecognizedTokens).toBeVisible();
                const hiddenToken = homeAssetsSection.hiddenToken(baseSymbol, hiddenTokenContract);
                await hiddenToken.click();
                await expect(homeAssetsSection.unhideModal).toBeVisible();
                await homeAssetsSection.cancelUnhideButton.click();
                await expect(homeAssetsSection.unhideModal).toBeHidden();
                await expect(hiddenToken).toBeVisible();
            });

            await test.step('Return to the asset home overview', async () => {
                await homeAssetsSection.backButton.click();
                await expect(dashboardPage.assetHome).toBeVisible();
                await expect(dashboardPage.assetHomeTable).toBeVisible();
                await expect(homeAssetsSection.networkGroup(btcSymbol)).toBeVisible();
            });
        },
    );
});
