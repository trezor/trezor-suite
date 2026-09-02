import { TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import { expect, test } from '../../support/fixtures';
import { ETH_MOCKED_ACCOUNT } from '../../support/mocks/eth-endpoints';
import {
    YIELD_USDC_DEPOSITED_AMOUNT,
    YIELD_USDC_VAULT_SHARE_TOKEN,
    YIELD_VAULTS,
} from '../../support/mocks/yieldMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

const { usdcPrime } = YIELD_VAULTS;
const YIELD_USDC_VAULT_DISPLAY_NAME = ['Trezor Steakhouse', '\n', 'USDC Prime Vault'];
const WITHDRAW_AMOUNT = '5';
const WITHDRAW_MAX_FEE = '0.00010840280031 ETH';
const NEW_BLOCK = {
    height: 22881954,
    hash: '0xa07d0d92b6bb9a5f388d47a10b824b4b09e0b3aeb08d0f61c0e30a25f6c8455f',
};

const buildEthAccountTokens = ({
    usdcBalance,
    shareBalance,
}: {
    usdcBalance: string;
    shareBalance: string;
}) => [
    ...ETH_MOCKED_ACCOUNT.tokens.map(token =>
        token.symbol === 'USDC' ? { ...token, balance: usdcBalance } : token,
    ),
    { ...YIELD_USDC_VAULT_SHARE_TOKEN, balance: shareBalance },
];

test.describe('stablecoin yield withdrawal', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
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
            tokens: buildEthAccountTokens({
                usdcBalance: '990000000',
                shareBalance: YIELD_USDC_VAULT_SHARE_TOKEN.balance,
            }),
        });
        await yieldMock.start();
        await settingsPage.changeNetworks({
            enableNetworks: [
                { symbol: 'eth', backend: { type: 'blockbook', url: blockbookMock.url } },
            ],
        });
    });

    test(
        'User can withdraw USDC from a yield vault',
        { annotation: createTestAnnotation({ stream: TestStream.Earn }) },
        async ({
            yieldSection,
            yieldFlowSection,
            txSimulationModal,
            devicePrompt,
            device,
            blockbookMock,
            yieldMock,
        }) => {
            await test.step('Deposited position is shown on the dashboard', async () => {
                await yieldSection.earnMenuButton.click();

                await expect(yieldSection.depositedAmount(usdcPrime.id)).toHaveTranslation(
                    'TR_EARN_YIELD_DASHBOARD_DEPOSITED',
                    { values: { amount: YIELD_USDC_DEPOSITED_AMOUNT, displaySymbol: 'USDC' } },
                );
                await expect(yieldSection.yearlyRewardAmount(usdcPrime.id)).toHaveText(
                    '0.426 USDC',
                );
                await expect(yieldSection.depositMoreButton(usdcPrime.id)).toBeVisible();
                await expect(yieldSection.depositNowButton(usdcPrime.id)).toBeHidden();

                await yieldSection.withdrawButton(usdcPrime.id).click();
            });

            await test.step(`Withdraw ${WITHDRAW_AMOUNT} USDC`, async () => {
                await yieldMock.mockUsdcWithdraw();
                await expect(yieldFlowSection.amountLabel).toHaveTranslation(
                    'TR_EARN_YIELD_AMOUNT_TO_WITHDRAW',
                );
                await yieldFlowSection.amountInput.fill(WITHDRAW_AMOUNT);

                await expect(yieldFlowSection.amountUnit).toHaveText('USDC');
                await expect(yieldFlowSection.summaryLabel).toContainTranslation(
                    'TR_EARN_YIELD_DEPOSITED',
                );
                await expect(yieldFlowSection.summaryAmount).toHaveText(
                    `${YIELD_USDC_DEPOSITED_AMOUNT} USDC`,
                );
                await yieldFlowSection.withdrawButton.click();

                await expect(txSimulationModal.sentAsset(0)).toHaveText('Sending 4.972 trSHUSDCp');
                await expect(txSimulationModal.sentAssetFiat(0)).toHaveText(
                    `-$${WITHDRAW_AMOUNT}.00`,
                );
                await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                    `Receiving ${WITHDRAW_AMOUNT} USDC`,
                );
                await expect(txSimulationModal.receivedAssetFiat(0)).toHaveText(
                    `+$${WITHDRAW_AMOUNT}.00`,
                );
                await expect(txSimulationModal.maxFeeAmount).toHaveText('0.000108403 ETH');
                await expect(txSimulationModal.maxFeeFiat).toHaveText('≈ $0.00');
                await txSimulationModal.confirmButton.click();

                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Withdraw' },
                        body: [['Review details to', '\n', 'withdraw from', '\n', 'vault.']],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        body: [['Review details to', '\n', 'withdraw from vault.']],
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Withdraw' },
                        body: [YIELD_USDC_VAULT_DISPLAY_NAME],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        body: [['Withdraw from'], YIELD_USDC_VAULT_DISPLAY_NAME],
                    },
                });
                await device.pressYes();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Withdraw' },
                        body: [
                            ['Withdraw amount'],
                            [`${WITHDRAW_AMOUNT} USDC`],
                            ['Chain'],
                            ['Ethereum'],
                        ],
                        actions: { right_button: 'Continue' },
                    },
                });
                await device.pressYes();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    WITHDRAW_MAX_FEE,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Withdraw' },
                        body: [
                            ['Maximum fee'],
                            device.wrapText(WITHDRAW_MAX_FEE, { isAmount: true }),
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();

                blockbookMock.updateAccountState({
                    txs: 4,
                    nonce: '3',
                    tokens: buildEthAccountTokens({
                        usdcBalance: '995000000',
                        shareBalance: '4972119227778247201',
                    }),
                });
                await devicePrompt.sendButton.click();

                await expect(yieldFlowSection.withdrawnToast).toBeVisible();
                await expect(yieldFlowSection.flowCompleteHeading).toHaveTranslation(
                    'TR_EARN_YIELD_WITHDRAW_COMPLETE',
                );
                await expect(yieldFlowSection.flowCompleteStatus).toHaveTranslation(
                    'TR_EARN_YIELD_COMPLETED',
                );
                await expect(yieldFlowSection.flowCompleteTransferOutputAmount).toHaveText(
                    `${WITHDRAW_AMOUNT} USDC`,
                );

                await blockbookMock.sendNewBlockNotification(NEW_BLOCK);
            });

            await test.step('Dashboard shows the reduced position', async () => {
                await yieldFlowSection.backToOverviewButton.click();

                await expect(yieldSection.depositedAmount(usdcPrime.id)).toHaveTranslation(
                    'TR_EARN_YIELD_DASHBOARD_DEPOSITED',
                    { values: { amount: '5', displaySymbol: 'USDC' } },
                );
                await expect(yieldSection.yearlyRewardAmount(usdcPrime.id)).toHaveText(
                    '0.213 USDC',
                );
                await expect(yieldSection.withdrawButton(usdcPrime.id)).toBeVisible();
            });
        },
    );
});
