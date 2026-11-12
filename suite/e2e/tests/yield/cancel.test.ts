import { events } from '@suite-common/analytics';
import { PROD_STAKING_SYMBOLS, asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import { expect, test } from '../../support/fixtures';
import { ETH_MOCKED_ACCOUNT } from '../../support/mocks/eth-endpoints';
import {
    YIELD_MERKL_CLAIM_REWARD,
    YIELD_USDC_VAULT_SHARE_TOKEN,
    YIELD_VAULTS,
} from '../../support/mocks/yieldMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

const { usdcPrime, usdtPrime } = YIELD_VAULTS;
const ETH_ACCOUNT = { symbol: 'eth', accountType: 'normal', index: 0 };
const CLAIM_REWARD_TOKEN = YIELD_MERKL_CLAIM_REWARD.token.symbol;
const APPROVE_AMOUNT = '10';
const WITHDRAW_AMOUNT = '5';

const USDC_VAULT_CONTEXT = { networkSymbol: 'eth', vaultId: usdcPrime.id };
const USDT_VAULT_CONTEXT = { networkSymbol: 'eth', vaultId: usdtPrime.id };
const WITHDRAW_CONTEXT = { ...USDC_VAULT_CONTEXT, action: 'continue', operation: 'withdraw' };
const CLAIM_CONTEXT = { action: 'continue', networkSymbol: 'eth' };
const DASHBOARD_CONTEXT = {
    hasYieldPosition: 'true',
    hasStakingPosition: 'true',
    hasClaimBanner: 'true',
    availableVaultCount: String(Object.keys(YIELD_VAULTS).length),
    availableStakingCount: String(PROD_STAKING_SYMBOLS.length),
    hasShowMore: 'false',
};

const NAVIGATE_DASHBOARD_TO_NUTSHELL = {
    ...USDT_VAULT_CONTEXT,
    action: 'continue',
    from: 'earn-dashboard',
    to: 'deposit-in-a-nutshell-modal',
};
const NAVIGATE_NUTSHELL_TO_LEGAL = {
    ...USDT_VAULT_CONTEXT,
    action: 'continue',
    from: 'deposit-in-a-nutshell-modal',
    to: 'deposit-legal-modal',
};
const NAVIGATE_DASHBOARD_TO_WITHDRAW_FORM = {
    ...USDC_VAULT_CONTEXT,
    action: 'continue',
    from: 'earn-dashboard',
    to: 'withdraw-form',
};
const NAVIGATE_WITHDRAW_FORM_CANCELLED = {
    ...USDC_VAULT_CONTEXT,
    action: 'cancel',
    from: 'withdraw-form',
    to: 'earn-dashboard',
};
const NAVIGATE_DASHBOARD_TO_CLAIM_MODAL = {
    action: 'continue',
    from: 'earn-dashboard',
    to: 'claim-select-account-modal',
};
const NAVIGATE_CLAIM_MODAL_TO_FORM = {
    action: 'continue',
    from: 'claim-select-account-modal',
    to: 'claim-form',
    networkSymbol: 'eth',
};
const NAVIGATE_CLAIM_FORM_CANCELLED = {
    action: 'cancel',
    from: 'claim-form',
    to: 'earn-dashboard',
    networkSymbol: 'eth',
};

test.describe(
    'stablecoin yield cancel',
    { tag: ['@webOnly', '@T3W1', '@T3T1', '@optional'] },
    () => {
        test.use({
            deviceSetup: {
                mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
            },
        });

        test.beforeEach(
            async ({ analytics, onboardingPage, settingsPage, blockbookMock, yieldMock }) => {
                await analytics.interceptAnalytics();
                await onboardingPage.completeOnboarding();
                await blockbookMock.start('eth');
                blockbookMock.updateAccountState({
                    txs: 3,
                    nonce: '2',
                    transactions: [ETH_STAKE_CONFIRMED_TX, ETH_BASE_TX],
                    tokens: [...ETH_MOCKED_ACCOUNT.tokens, YIELD_USDC_VAULT_SHARE_TOKEN],
                });
                await yieldMock.start();
                await yieldMock.mockMerklRewards();
                await settingsPage.changeNetworks({
                    enableNetworks: [
                        {
                            symbol: asNetworkSymbol('eth'),
                            backend: { type: 'blockbook', url: blockbookMock.url },
                        },
                    ],
                });
            },
        );

        test(
            'User can back out of every yield modal',
            { annotation: createTestAnnotation({ stream: TestStream.Earn }) },
            async ({
                analytics,
                yieldSection,
                yieldFlowSection,
                earnNutshellModal,
                yieldConsentModal,
                txSimulationModal,
                yieldMock,
            }) => {
                const earnEntryEvents = analytics.trackEvents(events.yieldEarnEntryEvent.name);
                const dashboardReadyEvents = analytics.trackEvents(
                    events.earnDashboardReadyEvent.name,
                );
                const navigateEvents = analytics.trackEvents(events.yieldNavigateEvent.name);
                const depositEvents = analytics.trackEvents(events.yieldDepositEvent.name);
                const withdrawEvents = analytics.trackEvents(events.yieldWithdrawEvent.name);
                const claimEvents = analytics.trackEvents(events.yieldClaimEvent.name);

                await test.step('Open the Earn dashboard', async () => {
                    await yieldSection.earnMenuButton.click();
                    await earnEntryEvents.expectNext({ from: 'settings-coins' });
                    await dashboardReadyEvents.expectNext(DASHBOARD_CONTEXT);
                    await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD');
                });

                await test.step('Cancel the earn-in-a-nutshell modal', async () => {
                    await yieldSection.clickDepositNow(usdtPrime.id);
                    await navigateEvents.expectNext(NAVIGATE_DASHBOARD_TO_NUTSHELL);
                    await expect(earnNutshellModal.heading).toHaveTranslation(
                        'TR_EARN_DEFI_YIELD_IN_A_NUTSHELL',
                    );

                    await earnNutshellModal.cancelButton.click();
                    await navigateEvents.expectNext({
                        ...USDT_VAULT_CONTEXT,
                        action: 'cancel',
                        from: 'deposit-in-a-nutshell-modal',
                        to: 'deposit-in-a-nutshell-modal',
                    });
                    await expect(earnNutshellModal.modalContainer).toBeHidden();
                });

                await test.step('Cancel the provider consent modal', async () => {
                    await yieldSection.clickDepositNow(usdtPrime.id);
                    await navigateEvents.expectNext(NAVIGATE_DASHBOARD_TO_NUTSHELL);
                    await earnNutshellModal.continueButton.click();
                    await navigateEvents.expectNext(NAVIGATE_NUTSHELL_TO_LEGAL);
                    await expect(yieldConsentModal.heading).toHaveTranslation(
                        'TR_EARN_DEPOSIT_TOKEN',
                        {
                            values: { symbol: 'USDT' },
                        },
                    );

                    await yieldConsentModal.closeButton.click();
                    await navigateEvents.expectNext({
                        ...USDT_VAULT_CONTEXT,
                        action: 'cancel',
                        from: 'deposit-legal-modal',
                        to: 'deposit-legal-modal',
                    });
                    await expect(yieldConsentModal.modalContainer).toBeHidden();
                });

                await test.step('Cancel the approve modal', async () => {
                    await yieldSection.clickDepositNow(usdtPrime.id);
                    await navigateEvents.expectNext(NAVIGATE_DASHBOARD_TO_NUTSHELL);
                    await earnNutshellModal.continueButton.click();
                    await navigateEvents.expectNext(NAVIGATE_NUTSHELL_TO_LEGAL);
                    await yieldConsentModal.acknowledgeCheckbox.click();
                    await yieldConsentModal.confirmButton.click();
                    await navigateEvents.expectNext({
                        ...USDT_VAULT_CONTEXT,
                        action: 'continue',
                        from: 'deposit-legal-modal',
                        to: 'deposit-form',
                    });

                    await yieldFlowSection.amountInput.fill(APPROVE_AMOUNT);
                    await yieldFlowSection.approveButton.click();
                    await depositEvents.expectNext({
                        ...USDT_VAULT_CONTEXT,
                        type: 'approve',
                        action: 'continue',
                        deviceStatus: 'connected',
                    });
                    await expect(yieldFlowSection.approveModalContinueButton).toBeVisible();

                    await yieldFlowSection.approveModalCloseButton.click();
                    await depositEvents.expectNext({
                        ...USDT_VAULT_CONTEXT,
                        type: 'approve-modal',
                        action: 'cancel',
                    });
                    await expect(yieldFlowSection.approveModalContinueButton).toBeHidden();
                    await expect(yieldFlowSection.approveButton).toBeEnabled();
                });

                await test.step('Leave the deposit form without depositing', async () => {
                    await yieldSection.earnMenuButton.click();
                    await navigateEvents.expectNext({
                        ...USDT_VAULT_CONTEXT,
                        action: 'cancel',
                        from: 'deposit-form',
                        to: 'earn-dashboard',
                    });
                    await earnEntryEvents.expectNext({ from: 'earn-yield-deposit' });
                    await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD');
                    await expect(yieldSection.depositNowButton(usdtPrime.id)).toBeVisible();
                });

                await test.step('Close the claim account selection', async () => {
                    await yieldSection.claimRewardsButton.click();
                    await navigateEvents.expectNext(NAVIGATE_DASHBOARD_TO_CLAIM_MODAL);
                    await expect(yieldSection.claimSelectAccountHeading).toHaveTranslation(
                        'TR_EARN_YIELD_CLAIM_MODAL_TITLE',
                    );

                    await yieldSection.claimSelectAccountCloseButton.click();
                    await navigateEvents.expectNext({
                        action: 'cancel',
                        from: 'claim-select-account-modal',
                        to: 'claim-select-account-modal',
                    });
                    await expect(yieldSection.claimSelectAccountModal).toBeHidden();
                });

                await test.step('Cancel the withdrawal simulation', async () => {
                    await yieldMock.mockUsdcWithdraw();
                    await yieldSection.withdrawButton(usdcPrime.id).click();
                    await navigateEvents.expectNext(NAVIGATE_DASHBOARD_TO_WITHDRAW_FORM);

                    await yieldFlowSection.amountInput.fill(WITHDRAW_AMOUNT);
                    await yieldFlowSection.withdrawButton.click();
                    await withdrawEvents.expectNext({
                        ...WITHDRAW_CONTEXT,
                        type: 'withdraw',
                        deviceStatus: 'connected',
                    });
                    await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                        `Receiving ${WITHDRAW_AMOUNT} USDC`,
                    );

                    await txSimulationModal.cancelButton.click();
                    await withdrawEvents.expectNext({
                        ...WITHDRAW_CONTEXT,
                        type: 'tx-simulation-modal',
                        action: 'cancel',
                    });
                    await expect(txSimulationModal.cancelButton).toBeHidden();
                    await expect(yieldFlowSection.withdrawButton).toBeEnabled();
                });

                await test.step('Leave the withdraw form without withdrawing', async () => {
                    await yieldSection.earnMenuButton.click();
                    await navigateEvents.expectNext(NAVIGATE_WITHDRAW_FORM_CANCELLED);
                    await earnEntryEvents.expectNext({ from: 'earn-yield-withdraw' });
                    await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD');
                    await expect(yieldSection.withdrawButton(usdcPrime.id)).toBeVisible();
                });

                await test.step('Cancel the claim simulation', async () => {
                    await yieldMock.mockMorphoClaim();
                    await yieldSection.claimRewardsButton.click();
                    await navigateEvents.expectNext(NAVIGATE_DASHBOARD_TO_CLAIM_MODAL);
                    await yieldSection.claimAccountButton(ETH_ACCOUNT).click();
                    await navigateEvents.expectNext(NAVIGATE_CLAIM_MODAL_TO_FORM);

                    await yieldFlowSection.claimButton.click();
                    await claimEvents.expectNext({
                        ...CLAIM_CONTEXT,
                        type: 'claim',
                        deviceStatus: 'connected',
                        rewardCount: '1',
                    });
                    await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                        `Receiving ${YIELD_MERKL_CLAIM_REWARD.claimableUnits} ${CLAIM_REWARD_TOKEN}`,
                    );

                    await txSimulationModal.cancelButton.click();
                    await claimEvents.expectNext({
                        networkSymbol: 'eth',
                        type: 'tx-simulation-modal',
                        action: 'cancel',
                        rewardCount: '1',
                    });
                    await expect(txSimulationModal.cancelButton).toBeHidden();
                    await expect(yieldFlowSection.claimButton).toBeEnabled();
                });

                await test.step('Leave the claim form without claiming', async () => {
                    await yieldSection.earnMenuButton.click();
                    await navigateEvents.expectNext(NAVIGATE_CLAIM_FORM_CANCELLED);
                    await earnEntryEvents.expectNext({ from: 'earn-yield-claim' });
                    await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD');
                    await expect(yieldSection.claimRewardsButton).toBeEnabled();
                });
            },
        );
    },
);
