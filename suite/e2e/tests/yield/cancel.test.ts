import { asNetworkSymbol } from '@suite-common/wallet-config';
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

test.describe(
    'stablecoin yield cancel',
    { tag: ['@webOnly', '@T3W1', '@T3T1', '@optional'] },
    () => {
        test.use({
            deviceSetup: {
                mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
            },
        });

        test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock, yieldMock }) => {
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
        });

        test(
            'User can back out of every yield modal',
            { annotation: createTestAnnotation({ stream: TestStream.Earn }) },
            async ({
                yieldSection,
                yieldFlowSection,
                earnNutshellModal,
                yieldConsentModal,
                txSimulationModal,
                yieldMock,
            }) => {
                await test.step('Open the Earn dashboard', async () => {
                    await yieldSection.earnMenuButton.click();
                    await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD');
                });

                await test.step('Cancel the earn-in-a-nutshell modal', async () => {
                    await yieldSection.clickDepositNow(usdtPrime.id);
                    await expect(earnNutshellModal.heading).toHaveTranslation(
                        'TR_EARN_DEFI_YIELD_IN_A_NUTSHELL',
                    );

                    await earnNutshellModal.cancelButton.click();
                    await expect(earnNutshellModal.modalContainer).toBeHidden();
                });

                await test.step('Cancel the provider consent modal', async () => {
                    await yieldSection.clickDepositNow(usdtPrime.id);
                    await earnNutshellModal.continueButton.click();
                    await expect(yieldConsentModal.heading).toHaveTranslation(
                        'TR_EARN_DEPOSIT_TOKEN',
                        {
                            values: { symbol: 'USDT' },
                        },
                    );

                    await yieldConsentModal.closeButton.click();
                    await expect(yieldConsentModal.modalContainer).toBeHidden();
                });

                await test.step('Cancel the approve modal', async () => {
                    await yieldSection.clickDepositNow(usdtPrime.id);
                    await earnNutshellModal.continueButton.click();
                    await yieldConsentModal.acknowledgeCheckbox.click();
                    await yieldConsentModal.confirmButton.click();

                    await yieldFlowSection.amountInput.fill(APPROVE_AMOUNT);
                    await yieldFlowSection.approveButton.click();
                    await expect(yieldFlowSection.approveModalContinueButton).toBeVisible();

                    await yieldFlowSection.approveModalCloseButton.click();
                    await expect(yieldFlowSection.approveModalContinueButton).toBeHidden();
                    await expect(yieldFlowSection.approveButton).toBeEnabled();
                });

                await test.step('Leave the deposit form without depositing', async () => {
                    await yieldSection.earnMenuButton.click();
                    await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD');
                    await expect(yieldSection.depositNowButton(usdtPrime.id)).toBeVisible();
                });

                await test.step('Close the claim account selection', async () => {
                    await yieldSection.claimRewardsButton.click();
                    await expect(yieldSection.claimSelectAccountHeading).toHaveTranslation(
                        'TR_EARN_YIELD_CLAIM_MODAL_TITLE',
                    );

                    await yieldSection.claimSelectAccountCloseButton.click();
                    await expect(yieldSection.claimSelectAccountModal).toBeHidden();
                });

                await test.step('Cancel the withdrawal simulation', async () => {
                    await yieldMock.mockUsdcWithdraw();
                    await yieldSection.withdrawButton(usdcPrime.id).click();

                    await yieldFlowSection.amountInput.fill(WITHDRAW_AMOUNT);
                    await yieldFlowSection.withdrawButton.click();
                    await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                        `Receiving ${WITHDRAW_AMOUNT} USDC`,
                    );

                    await txSimulationModal.cancelButton.click();
                    await expect(txSimulationModal.cancelButton).toBeHidden();
                    await expect(yieldFlowSection.withdrawButton).toBeEnabled();
                });

                await test.step('Leave the withdraw form without withdrawing', async () => {
                    await yieldSection.earnMenuButton.click();
                    await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD');
                    await expect(yieldSection.withdrawButton(usdcPrime.id)).toBeVisible();
                });

                await test.step('Cancel the claim simulation', async () => {
                    await yieldMock.mockMorphoClaim();
                    await yieldSection.claimRewardsButton.click();
                    await yieldSection.claimAccountButton(ETH_ACCOUNT).click();

                    await yieldFlowSection.claimButton.click();
                    await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                        `Receiving ${YIELD_MERKL_CLAIM_REWARD.claimableUnits} ${CLAIM_REWARD_TOKEN}`,
                    );

                    await txSimulationModal.cancelButton.click();
                    await expect(txSimulationModal.cancelButton).toBeHidden();
                    await expect(yieldFlowSection.claimButton).toBeEnabled();
                });

                await test.step('Leave the claim form without claiming', async () => {
                    await yieldSection.earnMenuButton.click();
                    await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD');
                    await expect(yieldSection.claimRewardsButton).toBeEnabled();
                });
            },
        );
    },
);
