import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import { expect, test } from '../../support/fixtures';
import { ETH_MOCKED_ACCOUNT } from '../../support/mocks/eth-endpoints';
import {
    YIELD_CLAIMED_MORPHO_TOKEN,
    YIELD_MERKL_CLAIM_REWARD,
    YIELD_USDC_VAULT_SHARE_TOKEN,
} from '../../support/mocks/yieldMock';

const CLAIM_REWARD_AMOUNT = `${YIELD_MERKL_CLAIM_REWARD.claimableUnits} MORPHO`;
const CLAIM_REWARD_FIAT_AMOUNT = '≈ $2.50';
const CLAIM_MAX_FEE = '0.00010840280031 ETH';
const NEW_BLOCK = {
    height: 22881954,
    hash: '0xa07d0d92b6bb9a5f388d47a10b824b4b09e0b3aeb08d0f61c0e30a25f6c8455f',
};

const buildEthAccountTokens = ({ withClaimedMorpho }: { withClaimedMorpho: boolean }) => [
    ...ETH_MOCKED_ACCOUNT.tokens.map(token =>
        token.symbol === 'USDC' ? { ...token, balance: '990000000' } : token,
    ),
    YIELD_USDC_VAULT_SHARE_TOKEN,
    ...(withClaimedMorpho ? [YIELD_CLAIMED_MORPHO_TOKEN] : []),
];

test.describe('stablecoin yield claim', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
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
            tokens: buildEthAccountTokens({ withClaimedMorpho: false }),
        });
        await yieldMock.start();
        await yieldMock.mockMerklRewards();
        await settingsPage.changeNetworks({
            enableNetworks: [
                { symbol: 'eth', backend: { type: 'blockbook', url: blockbookMock.url } },
            ],
        });
    });

    test('User can claim yield rewards', async ({
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
        await test.step('Dashboard shows the claim rewards banner', async () => {
            await yieldSection.earnMenuButton.click();

            await expect(yieldSection.claimRewardsAmount).toHaveText(CLAIM_REWARD_FIAT_AMOUNT);
            await yieldSection.claimRewardsButton.click();
        });

        await test.step('Select the account with claimable rewards', async () => {
            const ethAccount = { symbol: 'eth', accountType: 'normal', index: 0 };

            await expect(yieldSection.claimSelectAccountHeading).toHaveTranslation(
                'TR_EARN_YIELD_CLAIM_MODAL_TITLE',
            );
            await expect(yieldSection.claimAccountRewardAmounts(ethAccount)).toHaveText(
                CLAIM_REWARD_AMOUNT,
            );
            await expect(yieldSection.claimAccountFiatAmount(ethAccount)).toHaveText('$2.50');
            await yieldSection.claimAccountButton(ethAccount).click();
        });

        await test.step('Claim page lists the claimable rewards', async () => {
            await expect(yieldFlowSection.claimHeading).toHaveTranslation('TR_EARN_CLAIM_REWARDS');
            await expect(yieldFlowSection.claimRewardAmount).toHaveText(CLAIM_REWARD_AMOUNT);
            await expect(yieldFlowSection.claimRewardFiatAmount).toHaveText(
                CLAIM_REWARD_FIAT_AMOUNT,
            );
        });

        await test.step('Claim the rewards', async () => {
            await yieldMock.mockMorphoClaim();
            await yieldFlowSection.claimButton.click();

            await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                `Receiving ${CLAIM_REWARD_AMOUNT}`,
            );
            await expect(txSimulationModal.receivedAssetFiat(0)).toHaveText('+$2.50');
            await expect(txSimulationModal.maxFeeAmount).toHaveText('0.000108403 ETH');
            await expect(txSimulationModal.maxFeeFiat).toHaveText('≈ $0.00');
            await txSimulationModal.confirmButton.click();

            await devicePrompt.confirmOnDevicePromptIsShown();

            const ethAccountName = await walletPage
                .accountLabel({ symbol: 'eth', type: 'normal', atIndex: 0 })
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
            ).toHaveText('MORPHO');
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Rewards claim' },
                    body: [['Reward tokens'], ['MORPHO']],
                    actions: { right_button: 'Continue' },
                },
            });
            await device.pressYes();
            await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(CLAIM_MAX_FEE);
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
                'TOAST_TX_YIELD_CLAIM',
                { values: { account: ethAccountName } },
            );
            await expect(yieldFlowSection.flowCompleteHeading).toHaveTranslation(
                'TR_EARN_YIELD_CLAIM_COMPLETE',
            );
            await expect(yieldFlowSection.flowCompleteStatus).toHaveTranslation(
                'TR_EARN_YIELD_COMPLETED',
            );
            await expect(yieldFlowSection.flowCompleteRewardAmount).toHaveText(CLAIM_REWARD_AMOUNT);
            await expect(yieldFlowSection.flowCompleteRewardFiatAmount).toHaveText(
                CLAIM_REWARD_FIAT_AMOUNT,
            );

            await blockbookMock.sendNewBlockNotification(NEW_BLOCK);
        });

        await test.step('Dashboard no longer offers rewards to claim', async () => {
            await page.clock.install();
            await page.clock.fastForward('01:01');
            await yieldFlowSection.backToOverviewButton.click();

            await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD_TITLE');
            await expect(yieldSection.claimRewardsAmount).toHaveText('$0.00');
            await expect(yieldSection.claimRewardsButton).toBeDisabled();
        });
    });
});
