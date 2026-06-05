import { expect, test } from '../../support/fixtures';
import {
    YIELD_VAULT_APYS,
    YIELD_VAULT_APY_BREAKDOWN,
    YIELD_VAULT_NAMES,
    YIELD_VAULT_REWARDS,
} from '../../support/mocks/yieldMock';

//'@T3T1'
test.describe('stablecoin yield', { tag: ['@webOnly', '@T3W1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(
        async ({ onboardingPage, settingsPage, blockbookMock, dashboardPage, page, yieldMock }) => {
            await onboardingPage.completeOnboarding();
            await blockbookMock.start('eth');
            await yieldMock.start();
            await settingsPage.navigateTo('coins');
            await settingsPage.coinsTab.enableNetwork('eth');
            await settingsPage.coinsTab.openNetworkAdvanceSettings('eth');
            await settingsPage.coinsTab.changeBackend('blockbook', blockbookMock.url);
            await dashboardPage.dashboardMenuButton.click();
            await page.discoveryShouldFinish();
        },
    );

    test('yield deposit', async ({
        page,
        walletPage,
        yieldSection,
        yieldNutshellModal,
        yieldConsentModal,
    }) => {
        await test.step('Check yield dashboard', async () => {
            await page.getByTestId('@suite/menu/suite-earn').click();

            const ethAccountName = await walletPage
                .accountLabel({ symbol: 'eth', type: 'normal', atIndex: 0 })
                .textContent();

            await expect(yieldSection.yieldTitle).toHaveTranslation(
                'TR_EARN_STABLECOIN_YIELD_TITLE',
            );
            await expect(yieldSection.accountLabel(0)).toHaveText(ethAccountName!);
            await expect(yieldSection.accountLabel(1)).toHaveText(ethAccountName!);
            await expect(yieldSection.vaultSubtitle(0)).toHaveText(YIELD_VAULT_NAMES.usdcPrime);
            await expect(yieldSection.vaultSubtitle(1)).toHaveText(YIELD_VAULT_NAMES.usdtPrime);
            await expect(yieldSection.apyPercentage(0)).toHaveText(YIELD_VAULT_APYS.usdcPrime);
            await expect(yieldSection.apyPercentage(1)).toHaveText(YIELD_VAULT_APYS.usdtPrime);
            await expect(yieldSection.yearlyRewardAmount(0)).toHaveText(
                YIELD_VAULT_REWARDS.usdcPrime.yearly,
            );
            await expect(yieldSection.yearlyRewardAmount(1)).toHaveText(
                YIELD_VAULT_REWARDS.usdtPrime.yearly,
            );
            await expect(yieldSection.potentialRewardAmount(0)).toHaveText(
                YIELD_VAULT_REWARDS.usdcPrime.potential,
            );
            await expect(yieldSection.potentialRewardAmount(1)).toHaveText(
                YIELD_VAULT_REWARDS.usdtPrime.potential,
            );
        });

        await test.step('Check APY breakdown tooltip', async () => {
            await yieldSection.hoverApyPercentage(0);

            const { symbols, rates } = YIELD_VAULT_APY_BREAKDOWN.usdcPrime;
            await expect(yieldSection.apyBreakdownSymbols).toHaveText([...symbols]);
            await expect(yieldSection.apyBreakdownRates).toHaveText([...rates]);
            await expect(yieldSection.apyBreakdownDescriptions).toHaveTranslation([
                'TR_EARN_YIELD_APY_SOURCE_LENDING_INTEREST',
                'TR_EARN_YIELD_APY_SOURCE_PROTOCOL_INCENTIVE',
            ]);
            await expect(yieldSection.apyBreakdownFooter).toHaveTranslation(
                'TR_EARN_YIELD_APY_TOOLTIP_FOOTER',
            );
        });

        await test.step('Click deposit now', async () => {
            await yieldSection.clickDepositNow(0);
        });

        await test.step('Check earn-in-a-nutshell modal', async () => {
            await expect(yieldNutshellModal.heading).toHaveTranslation(
                'TR_EARN_SUPPLYING_IN_A_NUTSHELL',
            );
            await expect(yieldNutshellModal.depositProcess).toBeVisible();
            await expect(yieldNutshellModal.withdrawProcess).toBeVisible();
            await expect(yieldNutshellModal.claimProcess).toBeVisible();

            await yieldNutshellModal.expandDepositProcess();
            await expect(yieldNutshellModal.depositApyValue()).toHaveTranslation(
                'TR_EARN_APY_APPROX',
                { values: { apyPercent: YIELD_VAULT_APY_BREAKDOWN.usdcPrime.apyPercent } },
            );
            await yieldNutshellModal.clickContinue();
        });

        await test.step('Check consent modal', async () => {
            await expect(yieldConsentModal.heading).toHaveTranslation('TR_EARN_SUPPLY_TOKEN', {
                values: { symbol: 'USDC' },
            });
            await yieldConsentModal.checkAcknowledge();
            await yieldConsentModal.clickConfirm();
        });
    });
});
