import { events } from '@suite-common/analytics';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import { expect, test } from '../../support/fixtures';
import { ETH_MOCKED_ACCOUNT } from '../../support/mocks/eth-endpoints';
import {
    YIELD_CLAIMED_MORPHO_TOKEN,
    YIELD_MERKL_CLAIM_REWARD,
    YIELD_MERKL_SMALL_CLAIM_REWARD,
    YIELD_NEW_BLOCK,
    YIELD_USDC_VAULT_SHARE_TOKEN,
} from '../../support/mocks/yieldMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

const CLAIM_REWARD_TOKEN = YIELD_MERKL_CLAIM_REWARD.token.symbol;
const CLAIM_REWARD_AMOUNT = `${YIELD_MERKL_CLAIM_REWARD.claimableUnits} ${CLAIM_REWARD_TOKEN}`;
const SMALL_CLAIM_REWARD_AMOUNT = `${YIELD_MERKL_SMALL_CLAIM_REWARD.claimableUnits} ${CLAIM_REWARD_TOKEN}`;
const CLAIM_REWARD_FIAT_AMOUNT = '≈ $2.50';
const CLAIM_MAX_FEE = '0.00010840280031 ETH';

type BuildEthAccountTokensParams = { withClaimedMorpho: boolean };

const buildEthAccountTokens = ({ withClaimedMorpho }: BuildEthAccountTokensParams) => [
    ...ETH_MOCKED_ACCOUNT.tokens.map(token =>
        token.symbol === 'USDC' ? { ...token, balance: '990000000' } : token,
    ),
    YIELD_USDC_VAULT_SHARE_TOKEN,
    ...(withClaimedMorpho ? [YIELD_CLAIMED_MORPHO_TOKEN] : []),
];

const CLAIM_TXID = '0x5555555555555555555555555555555555555555555555555555555555555555';

type NavigateEvent = { action: string; from: string; to: string };

const NAVIGATE_DASHBOARD_TO_MODAL: NavigateEvent = {
    action: 'continue',
    from: 'earn-dashboard',
    to: 'claim-select-account-modal',
};
const NAVIGATE_MODAL_TO_FORM: NavigateEvent = {
    action: 'continue',
    from: 'claim-select-account-modal',
    to: 'claim-form',
};
const NAVIGATE_FORM_CANCELLED: NavigateEvent = {
    action: 'cancel',
    from: 'claim-form',
    to: 'earn-dashboard',
};
const NAVIGATE_FORM_COMPLETED: NavigateEvent = {
    action: 'continue',
    from: 'claim-form',
    to: 'earn-dashboard',
};

const CLAIM_CONTEXT = { action: 'continue', networkSymbol: 'eth' };

test.describe('stablecoin yield claim', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
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
            blockbookMock.setBroadcastTxid(CLAIM_TXID);
            blockbookMock.updateAccountState({
                txs: 3,
                nonce: '2',
                transactions: [ETH_STAKE_CONFIRMED_TX, ETH_BASE_TX],
                tokens: buildEthAccountTokens({ withClaimedMorpho: false }),
            });
            await yieldMock.start();
            await yieldMock.mockMerklRewards(YIELD_MERKL_SMALL_CLAIM_REWARD);
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
        'User can claim yield rewards',
        { annotation: createTestAnnotation({ stream: TestStream.Earn }) },
        async ({
            analytics,
            page,
            walletPage,
            yieldSection,
            yieldFlowSection,
            txSimulationModal,
            devicePrompt,
            device,
            blockbookMock,
            yieldMock,
        }) => {
            const ethAccount = { symbol: 'eth', accountType: 'normal', index: 0 };
            const earnEntryEvents = analytics.trackEvents(events.yieldEarnEntryEvent.name);
            const navigateEvents = analytics.trackEvents(events.yieldNavigateEvent.name);
            const claimEvents = analytics.trackEvents(events.yieldClaimEvent.name);

            await test.step('Claim page warns when the network fee exceeds the rewards', async () => {
                await yieldSection.earnMenuButton.click();
                await earnEntryEvents.expectNext({ from: 'settings-coins' });
                await yieldSection.claimRewardsButton.click();
                await navigateEvents.expectNext(NAVIGATE_DASHBOARD_TO_MODAL);

                await yieldSection.claimAccountButton(ethAccount).click();
                await navigateEvents.expectNext(NAVIGATE_MODAL_TO_FORM);

                await expect(yieldFlowSection.claimRewardAmount(CLAIM_REWARD_TOKEN)).toHaveText(
                    SMALL_CLAIM_REWARD_AMOUNT,
                );
                await expect(yieldFlowSection.claimFeeWarning).toHaveTranslation(
                    'TR_EARN_REWARDS_NETWORK_FEE_WARNING',
                );
            });

            await test.step('Rewards grow above the network fee', async () => {
                yieldMock.updateMerklReward(YIELD_MERKL_CLAIM_REWARD);
                // Let the rewards query go stale so the dashboard refetches on mount.
                await page.clock.install();
                await page.clock.fastForward('01:01');
            });

            await test.step('Dashboard shows the claim rewards banner', async () => {
                // Leaving the claim form without claiming is reported as a cancel.
                await yieldSection.earnMenuButton.click();
                await navigateEvents.expectNext(NAVIGATE_FORM_CANCELLED);
                // Returning from the flow route counts as a new Earn dashboard visit.
                await earnEntryEvents.expectNext({ from: 'earn-yield-claim' });

                await expect(yieldSection.claimRewardsAmount).toHaveText(CLAIM_REWARD_FIAT_AMOUNT);
                await yieldSection.claimRewardsButton.click();
                await navigateEvents.expectNext(NAVIGATE_DASHBOARD_TO_MODAL);
            });

            await test.step('Select the account with claimable rewards', async () => {
                await expect(yieldSection.claimSelectAccountHeading).toHaveTranslation(
                    'TR_EARN_YIELD_CLAIM_MODAL_TITLE',
                );
                await expect(yieldSection.claimAccountRewardAmounts(ethAccount)).toHaveText(
                    CLAIM_REWARD_AMOUNT,
                );
                await expect(yieldSection.claimAccountFiatAmount(ethAccount)).toHaveText('$2.50');
                await yieldSection.claimAccountButton(ethAccount).click();
                await navigateEvents.expectNext(NAVIGATE_MODAL_TO_FORM);
            });

            await test.step('Claim page lists the claimable rewards', async () => {
                await expect(yieldFlowSection.claimHeading).toHaveTranslation(
                    'TR_EARN_YIELD_CLAIM_REWARDS',
                );
                await expect(yieldFlowSection.claimRewardAmount(CLAIM_REWARD_TOKEN)).toHaveText(
                    CLAIM_REWARD_AMOUNT,
                );
                await expect(yieldFlowSection.claimRewardFiatAmount(CLAIM_REWARD_TOKEN)).toHaveText(
                    CLAIM_REWARD_FIAT_AMOUNT,
                );
                claimEvents.expectNone();
            });

            await test.step('Claim the rewards', async () => {
                await yieldMock.mockMorphoClaim();
                await expect(yieldFlowSection.claimButton).toBeEnabled();
                await expect(yieldFlowSection.claimFeeWarning).toBeHidden();
                await yieldFlowSection.claimButton.click();
                await claimEvents.expectNext({
                    ...CLAIM_CONTEXT,
                    type: 'claim',
                    deviceStatus: 'connected',
                    rewardCount: '1',
                });

                await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                    `Receiving ${CLAIM_REWARD_AMOUNT}`,
                );
                await expect(txSimulationModal.receivedAssetFiat(0)).toHaveText('+$2.50');
                await expect(txSimulationModal.maxFeeAmount).toHaveText('0.000108403 ETH');
                await expect(txSimulationModal.maxFeeFiat).toHaveText('≈ $0.00');
                await txSimulationModal.confirmButton.click();
                await claimEvents.expectNext({
                    ...CLAIM_CONTEXT,
                    type: 'tx-simulation-modal',
                    rewardCount: '1',
                });

                await devicePrompt.confirmOnDevicePromptIsShown();

                const ethAccountName = await walletPage
                    .accountLabel({ symbol: asNetworkSymbol('eth'), type: 'normal', atIndex: 0 })
                    .innerText();
                await expect(devicePrompt.header.accountLabel).toHaveText(ethAccountName);

                await expect(devicePrompt.outputValueOf('data')).toHaveText('Merkl.xyz');
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Rewards claim' },
                        body: [['Claim rewards from', '\n', 'Merkl.xyz']],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(
                    yieldFlowSection.claimReviewRewardToken(YIELD_MERKL_CLAIM_REWARD.token.address),
                ).toHaveText(CLAIM_REWARD_TOKEN);
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Rewards claim' },
                        body: [['Reward tokens'], [CLAIM_REWARD_TOKEN]],
                        actions: { right_button: 'Continue' },
                    },
                });
                await device.pressYes();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    CLAIM_MAX_FEE,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Rewards claim' },
                        body: [['Maximum fee'], device.wrapText(CLAIM_MAX_FEE, { isAmount: true })],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();

                blockbookMock.updateAccountState({
                    txs: 4,
                    nonce: '3',
                    tokens: buildEthAccountTokens({ withClaimedMorpho: true }),
                });
                await devicePrompt.sendButton.click();

                await expect(yieldFlowSection.claimedToast).toBeVisible();
                await expect(yieldFlowSection.claimedToastMessage).toHaveTranslation(
                    'TOAST_TX_CLAIM_PENDING',
                );
                // Broadcasting alone reports nothing; success waits for the on-chain resolution.
                claimEvents.expectNone();

                blockbookMock.updateAccountState({
                    transactions: [
                        { ...ETH_STAKE_CONFIRMED_TX, txid: CLAIM_TXID },
                        ETH_STAKE_CONFIRMED_TX,
                        ETH_BASE_TX,
                    ],
                });
                await blockbookMock.sendNewBlockNotification(YIELD_NEW_BLOCK);

                await expect(yieldFlowSection.flowCompleteHeading).toHaveTranslation(
                    'TR_EARN_YIELD_CLAIM_COMPLETE',
                );
                await expect(yieldFlowSection.flowCompleteStatus).toHaveTranslation(
                    'TR_EARN_YIELD_COMPLETED',
                );
                await expect(
                    yieldFlowSection.flowCompleteRewardAmount(CLAIM_REWARD_TOKEN),
                ).toHaveText(CLAIM_REWARD_AMOUNT);
                await expect(
                    yieldFlowSection.flowCompleteRewardFiatAmount(CLAIM_REWARD_TOKEN),
                ).toHaveText(CLAIM_REWARD_FIAT_AMOUNT);

                await claimEvents.expectNext({
                    ...CLAIM_CONTEXT,
                    type: 'success',
                    durationMs: expect.stringMatching(/^\d+$/),
                });
            });

            await test.step('Dashboard no longer offers rewards to claim', async () => {
                await page.clock.fastForward('01:01');
                await yieldFlowSection.backToOverviewButton.click();
                // Leaving the completed claim form is reported as a continue.
                await navigateEvents.expectNext(NAVIGATE_FORM_COMPLETED);
                await earnEntryEvents.expectNext({ from: 'earn-yield-claim' });

                await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD');
                await expect(yieldSection.claimRewardsAmount).toHaveText('$0.00');
                await expect(yieldSection.claimRewardsButton).toBeDisabled();
            });
        },
    );
});
