import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const btcSymbol = asNetworkSymbol('btc');

test.describe('Assets', { tag: ['@T3W1', '@T3T1', '@optional'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: [btcSymbol] });
        await dashboardPage.navigateTo();
    });

    test(
        'User can initiate buy from Assets in table view',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ assetsSection, tradingPage }) => {
            await assetsSection.tableIcon.click();
            await assetsSection.buyAssetButton(btcSymbol).click();
            await expect(tradingPage.section).toBeVisible();
        },
    );

    test(
        'User can initiate buy from Assets in grid view',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ assetsSection, tradingPage }) => {
            await assetsSection.gridIcon.click();
            await assetsSection.buyAssetButton(btcSymbol).click();
            await expect(tradingPage.section).toBeVisible();
        },
    );

    test(
        'New asset is shown in both grid and row',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, assetsSection }) => {
            await assetsSection.enableMoreCoins.click();
            await assetsSection.enableNetworkViaActivateAssetsModal(asNetworkSymbol('eth'));
            await page.discoveryShouldFinish();
            await assetsSection.verifyAssetContents();
            await assetsSection.tableIcon.click();
            await assetsSection.verifyAssetContents();
        },
    );
});
