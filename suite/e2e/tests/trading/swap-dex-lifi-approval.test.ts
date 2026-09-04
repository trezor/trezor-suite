import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { countDecimalPlaces } from '../../support/common';
import { expect, test } from '../../support/fixtures';

const ethSymbol = asNetworkSymbol('eth');
const approvalAmount = '10';
const accountLabel = 'Ethereum #2';
const providerName = 'LiFI Diamond';
const positiveEthereumAmountPattern = /^(?!0+(?:\.0+)?\s*ETH$)\d+(?:\.\d+)?\s*ETH$/;

test.describe('Trading - DEX swap approval (LI.FI)', { tag: ['@T3T1', '@T3W1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'mnemonic_academic',
            passphrase_protection: true,
        },
    });

    test.beforeEach(
        async ({ onboardingPage, dashboardPage, settingsPage, walletPage, tradingMockNew }) => {
            tradingMockNew.setTradeFlow('swap');
            const ethBackend = await tradingMockNew.startBackend(ethSymbol);

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [{ symbol: ethSymbol, backend: ethBackend }],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: ethSymbol, atIndex: 1 });
        },
    );

    test('User can approve USDC spending for a LI.FI DEX swap', async ({
        tradingPage,
        devicePrompt,
        device,
        tradingMockNew,
        toastSection,
        tradingResponses,
    }) => {
        const dexProvider = await tradingResponses.swap.companyName('lifi');

        await test.step('Select USDC to ETH LI.FI DEX offer', async () => {
            await tradingPage.fillSwapForm({
                amount: approvalAmount,
                sellAsset: {
                    networkSymbol: ethSymbol,
                    tokenSymbol: 'USDC',
                    searchFilter: 'USDC',
                    networkFilter: ethSymbol,
                    accountIndex: 1,
                },
                buyAsset: {
                    assetCryptoId: getCryptoId(ethSymbol),
                },
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(1, ethSymbol);
                },
            });
            await tradingPage.quotes.chooseDifferentOfferIfAvailable(dexProvider);
            await expect(tradingPage.approveSpendingButton).toHaveTranslation(
                'TR_EXCHANGE_APPROVAL_FORM_APPROVE_BUTTON',
            );
            await tradingPage.quotes.waitForSync();
        });

        let approvalModalMaximumFee: string;

        await test.step('Review the approval modal details', async () => {
            await tradingPage.approveSpendingButton.click();
            await expect(tradingPage.approvalModal.heading).toHaveTranslation(
                'TR_APPROVAL_APPROVE_TOKEN_SPENDING',
                { values: { displaySymbol: 'USDC' } },
            );

            await expect(tradingPage.approvalModal.accountValue).toHaveText(accountLabel);
            await expect(tradingPage.approvalModal.providerValue).toHaveText(dexProvider);
            await expect(tradingPage.approvalModal.limitValue).toHaveTranslation(
                'TR_APPROVAL_VALUE_MINIMAL',
                { values: { value: approvalAmount, send: 'USDC' } },
            );
        });

        await test.step('Toggle approval limit between infinite and minimal', async () => {
            await tradingPage.approvalModal.selectLimit('infinite');
            await expect(tradingPage.approvalModal.limitValue).toHaveTranslation(
                'TR_APPROVAL_VALUE_INFINITE',
            );

            await tradingPage.approvalModal.selectLimit('minimal');
            await expect(tradingPage.approvalModal.limitValue).toHaveTranslation(
                'TR_APPROVAL_VALUE_MINIMAL',
                { values: { value: approvalAmount, send: 'USDC' } },
            );
        });

        await test.step('Read the maximum fee and continue to the device', async () => {
            await expect(tradingPage.approvalModal.feeAmountWithSymbol).toHaveText(
                positiveEthereumAmountPattern,
            );
            approvalModalMaximumFee =
                await tradingPage.approvalModal.feeAmountWithSymbol.innerText();

            await tradingPage.approvalModal.continueButton.click();
        });

        await test.step('Review the token approval details on device', async () => {
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
                    body: [[providerName]],
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
                        [`${approvalAmount} USDC`],
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
        });

        await test.step('Verify the device fee matches the modal and sign', async () => {
            await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                positiveEthereumAmountPattern,
            );
            const dexMaximumFee = await devicePrompt.cryptoAmountWithSymbolOf('fee').innerText();

            // Device prompt keeps full fee precision; the approval modal rounds to display.
            expect(approvalModalMaximumFee).toMatch(/ ETH$/);
            const approvalModalFeeAmount = approvalModalMaximumFee.replace(/ ETH$/, '');
            const modalFeeDecimals = countDecimalPlaces(approvalModalFeeAmount);
            const dexFeeRounded = Number.parseFloat(dexMaximumFee).toFixed(modalFeeDecimals);

            expect(dexFeeRounded).toBe(approvalModalFeeAmount);

            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Token approval' },
                    body: [['Maximum fee'], device.wrapText(dexMaximumFee, { isAmount: true })],
                    actions: { right_button: 'Hold to sign' },
                },
                T3T1: {
                    header: { title: 'Summary' },
                },
            });
            await devicePrompt.waitForFinalPromptAndConfirm();
        });

        await test.step('Submit the USDC approval with broadcast blocked by mock', async () => {
            await devicePrompt.sendButton.click();
            await expect(toastSection.approved).toBeVisible();
            await expect(toastSection.approvedAmount).toHaveText(`${approvalAmount}USDC`);
            await expect(tradingPage.pendingApprovalTransactionLabel).toHaveTranslation(
                'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL',
            );
            await expect(tradingPage.pendingApprovalTransactionIdLabel).toHaveTranslation(
                'TR_EXCHANGE_APPROVAL_FORM_TRANSACTION_ID',
            );
            // While the approval is confirming, the swap button replaces the approve button and is disabled.
            await expect(tradingPage.swapButton).toBeDisabled();

            // Pending TXID keeps the full value in its id attribute (text is truncated).
            await expect(tradingPage.pendingApprovalTransactionId).toHaveAttribute(
                'id',
                tradingMockNew.lastBroadcastTxid,
            );
            await tradingPage.pendingApprovalTransactionId.click();
            await expect(tradingPage.approvalModal.heading).toHaveTranslation(
                'TR_TRANSACTION_DETAILS',
            );
            await expect(tradingPage.transactionDetailTxid).toHaveText(
                tradingMockNew.lastBroadcastTxid,
            );
        });
    });
});
