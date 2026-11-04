import { events } from '@suite-common/analytics';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import { expect, test } from '../../support/fixtures';
import { ETH_MOCKED_ACCOUNT } from '../../support/mocks/eth-endpoints';
import { YIELD_USDC_VAULT_SHARE_TOKEN, YIELD_VAULTS } from '../../support/mocks/yieldMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

// The USDC position makes the dashboard show the claim banner; USDT has no position yet,
// so its row still offers the full deposit entry with the nutshell and consent modals.
const { usdtPrime } = YIELD_VAULTS;

const VAULT_CONTEXT = { networkSymbol: 'eth', vaultId: usdtPrime.id };

const NAVIGATE_DASHBOARD_TO_NUTSHELL = {
    ...VAULT_CONTEXT,
    action: 'continue',
    from: 'earn-dashboard',
    to: 'deposit-in-a-nutshell-modal',
};
const NAVIGATE_NUTSHELL_TO_LEGAL = {
    ...VAULT_CONTEXT,
    action: 'continue',
    from: 'deposit-in-a-nutshell-modal',
    to: 'deposit-legal-modal',
};

test.describe('stablecoin yield cancel', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
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
        }) => {
            const earnEntryEvents = analytics.trackEvents(events.yieldEarnEntryEvent.name);
            const navigateEvents = analytics.trackEvents(events.yieldNavigateEvent.name);
            const depositEvents = analytics.trackEvents(events.yieldDepositEvent.name);

            await test.step('Open the Earn dashboard', async () => {
                await yieldSection.earnMenuButton.click();
                await earnEntryEvents.expectNext({ from: 'settings-coins' });
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
                    ...VAULT_CONTEXT,
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
                await expect(yieldConsentModal.heading).toHaveTranslation('TR_EARN_DEPOSIT_TOKEN', {
                    values: { symbol: 'USDT' },
                });

                await yieldConsentModal.closeButton.click();
                await navigateEvents.expectNext({
                    ...VAULT_CONTEXT,
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
                    ...VAULT_CONTEXT,
                    action: 'continue',
                    from: 'deposit-legal-modal',
                    to: 'deposit-form',
                });

                await yieldFlowSection.amountInput.fill('10');
                await yieldFlowSection.approveButton.click();
                await depositEvents.expectNext({
                    ...VAULT_CONTEXT,
                    type: 'approve',
                    action: 'continue',
                    deviceStatus: 'connected',
                });

                await yieldFlowSection.approveModalCloseButton.click();
                await depositEvents.expectNext({
                    ...VAULT_CONTEXT,
                    type: 'approve-modal',
                    action: 'cancel',
                });
                await expect(yieldFlowSection.approveModalContinueButton).toBeHidden();
                await expect(yieldFlowSection.approveButton).toBeEnabled();
            });

            await test.step('Leave the deposit form without depositing', async () => {
                await yieldSection.earnMenuButton.click();
                await navigateEvents.expectNext({
                    ...VAULT_CONTEXT,
                    action: 'cancel',
                    from: 'deposit-form',
                    to: 'earn-dashboard',
                });
                await earnEntryEvents.expectNext({ from: 'earn-yield-deposit' });
            });

            await test.step('Close the claim account selection', async () => {
                await yieldSection.claimRewardsButton.click();
                await navigateEvents.expectNext({
                    action: 'continue',
                    from: 'earn-dashboard',
                    to: 'claim-select-account-modal',
                });
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
        },
    );
});
