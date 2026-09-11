import { asNetworkSymbol } from '@suite-common/networks';
import { TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import { expect, test } from '../../support/fixtures';
import { ETH_MOCKED_ACCOUNT } from '../../support/mocks/eth-endpoints';
import {
    YIELD_NEW_BLOCK,
    YIELD_VAULTS,
    YIELD_WETH_TOKEN,
    YIELD_WETH_VAULT_SHARE_TOKEN,
} from '../../support/mocks/yieldMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

const { wethPrime } = YIELD_VAULTS;
const DEPOSIT_AMOUNT = '10';
const DEPOSIT_AMOUNT_FORMATTED = '10.00';
const YIELD_WETH_VAULT_DISPLAY_NAME = ['Trezor Steakhouse', '\n', 'ETH Prime Vault'];
const YIELD_WETH_VAULT_DISPLAY_NAME_T3T1 = ['Trezor Steakhouse ETH', '\n', 'Prime Vault'];
const WRAP_MAX_FEE = '0.00010840280031 ETH';
const DEPOSIT_MAX_FEE = '0.00010840280031 ETH';
const APPROVE_MAX_FEE = '0.00003161748342375 ETH';
const BALANCE_AFTER_WRAP = '1223999891597199690000';
const BALANCE_AFTER_APPROVE = '1223999859979716266250';
const BALANCE_AFTER_DEPOSIT = '1223999751576915956250';

const APPROVE_TXID = '0x9a6e2c41d7b83f05e1c9a2d64b7f80c53a1e0d92c4b6f7a8091d3e5c2b4a6f81';
const DEPOSIT_TXID = '0x3c8b1f6a2e94d07c5b3a8e1f9d62047ae5c1b39f8d27a604c9e5b2a1f7d38c02';

test.describe('eth yield deposit with wrap', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock, yieldMock }) => {
        await onboardingPage.completeOnboarding();
        await blockbookMock.start('eth');
        await yieldMock.start();
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
        'User can wrap ETH and deposit it into a WETH yield vault',
        { annotation: createTestAnnotation({ stream: TestStream.Earn }) },
        async ({
            page,
            yieldSection,
            yieldFlowSection,
            yieldNutshellModal,
            yieldConsentModal,
            txSimulationModal,
            devicePrompt,
            device,
            blockbookMock,
            yieldMock,
            toastSection,
        }) => {
            await test.step('Start a deposit into the WETH vault', async () => {
                await yieldSection.earnMenuButton.click();
                await expect(yieldSection.vaultSubtitle(wethPrime.id)).toHaveText(wethPrime.name);
                await expect(yieldSection.apyPercentage(wethPrime.id)).toHaveText(wethPrime.apy);
                await yieldSection.clickDepositNow(wethPrime.id);

                await yieldNutshellModal.depositProcess.click();
                await expect(yieldNutshellModal.depositApyValue).toHaveTranslation(
                    'TR_EARN_APY_APPROX',
                    { values: { apyPercent: wethPrime.apyBreakdown.apyPercent } },
                );
                await yieldNutshellModal.continueButton.click();

                await expect(yieldConsentModal.heading).toHaveTranslation('TR_EARN_DEPOSIT_TOKEN', {
                    values: { symbol: 'ETH' },
                });
                await yieldConsentModal.acknowledgeCheckbox.click();
                await yieldConsentModal.confirmButton.click();
            });

            await test.step('Wrap amount is validated', async () => {
                await expect(yieldFlowSection.wrapButton).toBeVisible();
                await expect(yieldFlowSection.approveButton).toBeHidden();
                await expect(yieldFlowSection.depositButton).toBeHidden();

                await expect(yieldFlowSection.amountUnit).toHaveText('ETH');
                await expect(yieldFlowSection.summaryLabel).toContainTranslation(
                    'TR_EARN_YIELD_AVAILABLE_TO_WRAP',
                );
                await expect(yieldFlowSection.wrapButton).toBeDisabled();
                await yieldFlowSection.amountInput.fill('1234.1');
                await expect(yieldFlowSection.insufficientFundsWarning).toContainTranslation(
                    'AMOUNT_IS_NOT_ENOUGH',
                );
                await expect(yieldFlowSection.wrapButton).toBeDisabled();
                await yieldFlowSection.amountInput.fill('1234');
                await expect(yieldFlowSection.insufficientFundsWarning).toBeHidden();
                await expect(yieldFlowSection.reserveRecommendationWarning).toContainTranslation(
                    'TR_EARN_YIELD_WRAP_RESERVE_RECOMMENDED',
                    { values: { amount: '0.005', nativeSymbol: 'ETH' } },
                );
                await expect(yieldFlowSection.wrapButton).toBeEnabled();
                await yieldFlowSection.maxButton.click();
                await expect(yieldFlowSection.amountInput).toHaveValue('1,233.995');
            });

            await test.step('Wrap ETH to WETH', async () => {
                await page.clock.install();
                await yieldMock.mockEthWrap();

                await yieldFlowSection.amountInput.fill(DEPOSIT_AMOUNT);
                await expect(yieldFlowSection.insufficientFundsWarning).toBeHidden();
                await expect(yieldFlowSection.reserveRecommendationWarning).toBeHidden();
                await expect(yieldFlowSection.wrapReceivingAmount).toHaveText(
                    `${DEPOSIT_AMOUNT} WETH`,
                );
                await expect(yieldFlowSection.wrapSkipButton).toBeHidden();

                await yieldFlowSection.wrapButton.click();
                await expect(txSimulationModal.sentAsset(0)).toHaveText('Sending 10 ETH');
                await expect(txSimulationModal.sentAssetFiat(0)).toHaveText('-$25,000.00');
                await expect(txSimulationModal.receivedAsset(0)).toHaveText('Receiving 10 WETH');
                await expect(txSimulationModal.receivedAssetFiat(0)).toHaveText('+$25,000.00');
                await expect(txSimulationModal.maxFeeAmount).toHaveText('0.000108403 ETH');
                await expect(txSimulationModal.maxFeeFiat).toHaveText('≈ $0.00');
                await txSimulationModal.confirmButton.click();

                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Provider' },
                        body: [['WETH']],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Intent' },
                        body: [['Wrap ETH to WETH']],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await device.pressYes();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm contract' },
                        body: [['Amount'], [`${DEPOSIT_AMOUNT} ETH`]],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await device.pressYes();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(WRAP_MAX_FEE);
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: '' },
                        body: [['Maximum fee'], device.wrapText(WRAP_MAX_FEE, { isAmount: true })],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await devicePrompt.sendButton.click();

                await expect(toastSection.wrapped).toBeVisible();
                await expect(toastSection.wrappedSendAmount).toHaveText(DEPOSIT_AMOUNT_FORMATTED);
                await expect(toastSection.wrappedReceiveAmount).toHaveText(
                    DEPOSIT_AMOUNT_FORMATTED,
                );
                await expect(yieldFlowSection.pendingTransactionLabel).toHaveTranslation(
                    'TR_EARN_YIELD_PENDING_WRAP',
                );

                blockbookMock.updateAccountState({
                    txs: 2,
                    nonce: '2',
                    balance: BALANCE_AFTER_WRAP,
                    transactions: [ETH_STAKE_CONFIRMED_TX, ETH_BASE_TX],
                    tokens: [...ETH_MOCKED_ACCOUNT.tokens, YIELD_WETH_TOKEN],
                });
                await page.clock.fastForward('01:00');
            });

            await test.step('Approve WETH spending', async () => {
                // The confirmed wrap advances the wizard to the approve step.
                await expect(yieldFlowSection.approveButton).toBeVisible();
                await expect(yieldFlowSection.wrapButton).toBeHidden();
                await expect(yieldFlowSection.depositButton).toBeHidden();

                await yieldMock.mockWethDeposit();
                blockbookMock.setBroadcastTxid(APPROVE_TXID);

                await yieldFlowSection.approveButton.click();
                await yieldFlowSection.approveModalContinueButton.click();

                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Token approval' },
                        body: [['Review details to', '\n', 'approve token', '\n', 'spending.']],
                        actions: { right_button: 'Continue' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Token approval' },
                        body: [YIELD_WETH_VAULT_DISPLAY_NAME],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        header: { title: 'Approve to' },
                    },
                });
                await device.pressYes();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Token approval' },
                        body: [
                            ['Amount allowance'],
                            [`${DEPOSIT_AMOUNT} WETH`],
                            ['Chain'],
                            ['Ethereum'],
                        ],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        header: { title: 'Approve' },
                    },
                });
                await device.pressYes();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    APPROVE_MAX_FEE,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Token approval' },
                        body: [
                            ['Maximum fee'],
                            device.wrapText(APPROVE_MAX_FEE, { isAmount: true }),
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                    T3T1: {
                        header: { title: 'Summary' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await devicePrompt.sendButton.click();

                await expect(toastSection.approved).toBeVisible();
                await expect(toastSection.approvedAmount).toHaveText(
                    `${DEPOSIT_AMOUNT_FORMATTED}WETH`,
                );
                await expect(yieldFlowSection.pendingTransactionLabel).toHaveTranslation(
                    'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL',
                );

                blockbookMock.updateAccountState({
                    txs: 3,
                    nonce: '3',
                    balance: BALANCE_AFTER_APPROVE,
                    transactions: [
                        { ...ETH_STAKE_CONFIRMED_TX, txid: APPROVE_TXID },
                        ETH_STAKE_CONFIRMED_TX,
                        ETH_BASE_TX,
                    ],
                });
                blockbookMock.updateAllowance('10000000000000000000'); // 10 WETH
                await page.clock.fastForward('01:00');
            });

            await test.step('Deposit WETH', async () => {
                blockbookMock.setBroadcastTxid(DEPOSIT_TXID);

                await expect(yieldFlowSection.depositButton).toBeVisible();
                await expect(yieldFlowSection.approveButton).toBeHidden();
                await expect(yieldFlowSection.approvedAmount).toHaveText(`${DEPOSIT_AMOUNT} WETH`);

                await yieldFlowSection.amountInput.fill('');
                await expect(yieldFlowSection.depositButton).toBeDisabled();

                await yieldFlowSection.amountInput.fill('10.5');
                await expect(yieldFlowSection.approvalTooLowWarning).toContainTranslation(
                    'TR_EARN_YIELD_APPROVAL_TOO_LOW',
                );
                await expect(yieldFlowSection.depositButton).toBeDisabled();

                await yieldFlowSection.modifyApprovalButton.click();
                await expect(yieldFlowSection.approveButton).toBeVisible();
                await expect(yieldFlowSection.depositButton).toBeHidden();
                await expect(yieldFlowSection.amountInput).toHaveValue(DEPOSIT_AMOUNT);
                await expect(yieldFlowSection.approvedAmount).toHaveText(`${DEPOSIT_AMOUNT} WETH`);
                await expect(yieldFlowSection.approveButton).toBeEnabled();
                await yieldFlowSection.approveSkipButton.click();

                await expect(yieldFlowSection.depositButton).toBeVisible();
                await expect(yieldFlowSection.approveButton).toBeHidden();
                await expect(yieldFlowSection.amountInput).toHaveValue(DEPOSIT_AMOUNT);
                await expect(yieldFlowSection.approvalTooLowWarning).toBeHidden();
                await yieldFlowSection.depositButton.click();

                await expect(txSimulationModal.sentAsset(0)).toHaveText('Sending 10 WETH');
                await expect(txSimulationModal.sentAssetFiat(0)).toHaveText('-$25,000.00');
                await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                    'Receiving 8 trSHWETHp',
                );
                await expect(txSimulationModal.receivedAssetFiat(0)).toHaveText('+$25,000.00');
                await expect(txSimulationModal.maxFeeAmount).toHaveText('0.000108403 ETH');
                await expect(txSimulationModal.maxFeeFiat).toHaveText('≈ $0.00');
                await txSimulationModal.confirmButton.click();

                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Deposit' },
                        body: [['Review details to', '\n', 'deposit to vault.']],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Deposit' },
                        body: [YIELD_WETH_VAULT_DISPLAY_NAME],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        body: [['Deposit to'], YIELD_WETH_VAULT_DISPLAY_NAME_T3T1],
                    },
                });
                await device.pressYes();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Deposit' },
                        body: [
                            ['Deposit amount'],
                            [`${DEPOSIT_AMOUNT} WETH`],
                            ['Chain'],
                            ['Ethereum'],
                        ],
                        actions: { right_button: 'Continue' },
                    },
                });
                await device.pressYes();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    DEPOSIT_MAX_FEE,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Deposit' },
                        body: [
                            ['Maximum fee'],
                            device.wrapText(DEPOSIT_MAX_FEE, { isAmount: true }),
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();

                blockbookMock.updateAllowance('0');
                blockbookMock.updateAccountState({
                    txs: 4,
                    nonce: '4',
                    balance: BALANCE_AFTER_DEPOSIT,
                    transactions: [
                        { ...ETH_STAKE_CONFIRMED_TX, txid: DEPOSIT_TXID },
                        { ...ETH_STAKE_CONFIRMED_TX, txid: APPROVE_TXID },
                        ETH_STAKE_CONFIRMED_TX,
                        ETH_BASE_TX,
                    ],
                    tokens: [
                        ...ETH_MOCKED_ACCOUNT.tokens,
                        { ...YIELD_WETH_TOKEN, balance: '0', transfers: 2 },
                        YIELD_WETH_VAULT_SHARE_TOKEN,
                    ],
                });
                await devicePrompt.sendButton.click();

                await expect(toastSection.yieldDeposit).toBeVisible();
                await expect(yieldFlowSection.flowCompleteHeading).toHaveTranslation(
                    'TR_EARN_YIELD_DEPOSIT_COMPLETE',
                );
                await expect(yieldFlowSection.flowCompleteStatus).toHaveTranslation(
                    'TR_EARN_YIELD_COMPLETED',
                );
                await expect(yieldFlowSection.flowCompleteApy).toHaveText(wethPrime.apy);
                await expect(yieldFlowSection.flowCompleteTransferInputAmount).toHaveText(
                    `${DEPOSIT_AMOUNT} ETH`,
                );
                await expect(yieldFlowSection.flowCompleteTransferOutputAmount).toHaveText(
                    '8 trSHWETHp',
                );

                await blockbookMock.sendNewBlockNotification(YIELD_NEW_BLOCK);
            });

            await test.step('Returning to the dashboard shows the deposited position', async () => {
                await yieldFlowSection.backToOverviewButton.click();

                // 8 shares at pricePerShare 1.25 = 10, yearly reward = 10 × 3.1% APY.
                await expect(yieldSection.depositedAmount(wethPrime.id)).toHaveTranslation(
                    'TR_EARN_YIELD_DASHBOARD_DEPOSITED',
                    { values: { amount: DEPOSIT_AMOUNT_FORMATTED, displaySymbol: 'ETH' } },
                );
                await expect(yieldSection.yearlyRewardAmount(wethPrime.id)).toHaveText('0.31 ETH');
                await expect(yieldSection.withdrawButton(wethPrime.id)).toBeVisible();
                await expect(yieldSection.depositMoreButton(wethPrime.id)).toBeVisible();
                await expect(yieldSection.depositNowButton(wethPrime.id)).toBeHidden();
            });
        },
    );
});
