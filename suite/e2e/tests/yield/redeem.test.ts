import { TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import { expect, test } from '../../support/fixtures';
import { ETH_MOCKED_ACCOUNT } from '../../support/mocks/eth-endpoints';
import { YIELD_USDC_VAULT_SHARE_TOKEN, YIELD_VAULTS } from '../../support/mocks/yieldMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

const { usdcPrime } = YIELD_VAULTS;
const YIELD_USDC_VAULT_DISPLAY_NAME = ['Trezor Steakhouse', '\n', 'USDC Prime Vault'];
const REDEEM_SHARES_AMOUNT = '3';
// REDEEM_SHARES_AMOUNT × pricePerShare (1.005607422297114)
const REDEEM_PAYOUT_AMOUNT = '3.016822';
// YIELD_USDC_VAULT_SHARE_TOKEN.balance (18 decimals) converted to units
const REDEEM_MAX_SHARES_AMOUNT = '9.944238455556494216';
const REDEEM_MAX_FEE = '0.00010840280031 ETH';
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

test.describe('stablecoin yield redeem', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
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
        'User can redeem yield vault shares using the max button',
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
            await test.step('Open the withdraw form', async () => {
                await yieldSection.earnMenuButton.click();
                await yieldSection.withdrawButton(usdcPrime.id).click();
            });

            await test.step('Max switches the amount input into trSHUSDCp shares', async () => {
                await expect(yieldFlowSection.amountUnit).toHaveText('USDC');
                await yieldFlowSection.maxButton.click();

                await expect(yieldFlowSection.amountUnit).toHaveText('trSHUSDCp');
                await expect(yieldFlowSection.amountInput).toHaveValue(REDEEM_MAX_SHARES_AMOUNT);
                await expect(yieldFlowSection.redeemButton).toBeVisible();
                await expect(yieldFlowSection.withdrawButton).toBeHidden();
                await expect(yieldFlowSection.maxWithdrawInfoBanner).toHaveTranslation(
                    'TR_EARN_YIELD_MAX_WITHDRAW_INFO',
                    { values: { receiptTokenSymbol: 'trSHUSDCp' } },
                );
            });

            await test.step(`Redeem ${REDEEM_SHARES_AMOUNT} trSHUSDCp shares`, async () => {
                await yieldMock.mockUsdcRedeem();
                await yieldFlowSection.amountInput.fill(REDEEM_SHARES_AMOUNT);
                await yieldFlowSection.redeemButton.click();

                await expect(txSimulationModal.sentAsset(0)).toHaveText(
                    `Sending ${REDEEM_SHARES_AMOUNT} trSHUSDCp`,
                );
                await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                    `Receiving ${REDEEM_PAYOUT_AMOUNT} USDC`,
                );
                await txSimulationModal.confirmButton.click();

                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Redeem' },
                        body: [['Review details to', '\n', 'redeem from vault.']],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Redeem' },
                        body: [YIELD_USDC_VAULT_DISPLAY_NAME],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        body: [['Redeem from'], YIELD_USDC_VAULT_DISPLAY_NAME],
                    },
                });
                await device.pressYes();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Redeem' },
                        body: [
                            ['Redeem amount'],
                            [`${REDEEM_SHARES_AMOUNT} trSHUSDCp`],
                            ['Chain'],
                            ['Ethereum'],
                        ],
                        actions: { right_button: 'Continue' },
                    },
                });
                await device.pressYes();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    REDEEM_MAX_FEE,
                );
                await devicePrompt.waitForFinalPromptAndConfirm();

                blockbookMock.updateAccountState({
                    txs: 4,
                    nonce: '3',
                    tokens: buildEthAccountTokens({
                        usdcBalance: '993016822',
                        shareBalance: '6944238455556494216',
                    }),
                });
                await devicePrompt.sendButton.click();

                await expect(yieldFlowSection.withdrawnToast).toBeVisible();
                await expect(yieldFlowSection.flowCompleteHeading).toHaveTranslation(
                    'TR_EARN_YIELD_WITHDRAW_COMPLETE',
                );
                await expect(yieldFlowSection.flowCompleteTransferInputAmount).toHaveText(
                    `${REDEEM_SHARES_AMOUNT} trSHUSDCp`,
                );
                await expect(yieldFlowSection.flowCompleteTransferOutputAmount).toHaveText(
                    `${REDEEM_PAYOUT_AMOUNT} USDC`,
                );

                await blockbookMock.sendNewBlockNotification(NEW_BLOCK);
            });

            await test.step('Dashboard shows the reduced position', async () => {
                await yieldFlowSection.backToOverviewButton.click();

                await expect(yieldSection.depositedAmount(usdcPrime.id)).toHaveTranslation(
                    'TR_EARN_YIELD_DASHBOARD_DEPOSITED',
                    { values: { amount: '6.983177', displaySymbol: 'USDC' } },
                );
                await expect(yieldSection.withdrawButton(usdcPrime.id)).toBeVisible();
            });
        },
    );
});
