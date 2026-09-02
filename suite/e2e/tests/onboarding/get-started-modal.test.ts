import { NetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const networks: NetworkSymbol[] = ['btc', 'eth', 'pol', 'bsc', 'arb'];

test.describe('Onboarding', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test(
        'Verify get started modal works and loads coins',
        { annotation: createTestAnnotation({ stream: TestStream.Growth }) },
        async ({ dashboardPage, assetsSection, page }) => {
            await expect(dashboardPage.discoveryEmptyHeader).toHaveTranslation(
                'TR_YOUR_WALLET_IS_READY_WHAT',
            );
            await dashboardPage.discoveryEmptyPrimaryButton.click();

            await expect(page.modalHeader).toHaveTranslation(
                'TR_DASHBOARD_MODAL_ACTIVATE_ASSETS_TITLE',
            );
            await assetsSection.activateAssetsModalNoteGotItButton.click();

            await assetsSection.enableNetworkViaActivateAssetsModal(networks);
            await page.discoveryShouldFinish();
            for (const coin of networks) {
                await expect(assetsSection.assetName(coin)).toBeVisible();
            }
            await expect(dashboardPage.discoveryEmptyHeader).toBeHidden();
        },
    );
});
