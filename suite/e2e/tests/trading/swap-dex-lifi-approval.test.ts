import { AddressFormatter } from '@suite-common/formatters';
import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getErc20ApproveSpender } from '@suite-common/wallet-utils';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { getAddressProviderName } from '../../support/helpers/ethereumDefinitions';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

const ethSymbol = asNetworkSymbol('eth');
const ethereumChainId = 1;

const approvalAmount = '60';
const positiveEthereumAmountPattern = /^(?!0+(?:\.0+)?\s*ETH$)\d+(?:\.\d+)?\s*ETH$/;

test.describe('Trading - DEX swap approval (LI.FI)', { tag: ['@T3T1', '@T3W1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'mnemonic_academic',
            passphrase_protection: true,
        },
    });

    test.beforeEach(
        async ({ onboardingPage, dashboardPage, settingsPage, walletPage, tradingMock }) => {
            tradingMock.setTradeFlow('swap');
            const ethBackend = await tradingMock.startBackend(ethSymbol);

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [{ symbol: ethSymbol, backend: ethBackend }],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: ethSymbol, atIndex: 2 });
        },
    );

    test(
        'User can approve USDC spending for a LI.FI DEX swap',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ page, tradingPage, devicePrompt, device, tradingMock, tradingResponses }) => {
            const dexProvider = await tradingResponses.swap.companyName('lifi');

            await test.step('Select USDC to ETH LI.FI DEX offer', async () => {
                await tradingPage.fillSwapForm({
                    amount: approvalAmount,
                    sellAsset: {
                        networkSymbol: ethSymbol,
                        tokenSymbol: 'USDC',
                        searchFilter: 'USDC',
                        networkFilter: 'eth',
                        accountIndex: 2,
                    },
                    buyAsset: {
                        assetCryptoId: getCryptoId(ethSymbol),
                    },
                    selectReceiveAddress: async () => {
                        await tradingPage.receiveAccount.selectSuiteReceiveAccount({
                            symbol: ethSymbol,
                            atIndex: 2,
                        });
                    },
                });
                await tradingPage.quotes.chooseDifferentOfferIfAvailable(dexProvider);
                await expect(tradingPage.swapBestOfferButton).toHaveTranslation('TR_CONTINUE');
                await tradingPage.quotes.waitForSync();
            });

            await test.step('Continue to the approval step', async () => {
                await tradingPage.swapBestOfferButton.click();
                await expect(tradingPage.approvalSteps.approveStep).toBeVisible();
                await tradingPage.approvalSteps.continueButton.click();
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

                const dexTxData = await page.getReduxObject(
                    'wallet.trading.exchange.selectedQuote.dexTx.data',
                );
                const spender = getErc20ApproveSpender(dexTxData);
                if (!spender) {
                    throw new Error('The LI.FI approval trade has no approve calldata');
                }

                const { major_version, minor_version, patch_version } = await page.getReduxObject(
                    'device.selectedDevice.features',
                );
                const spenderProviderName = await getAddressProviderName({
                    chainId: ethereumChainId,
                    address: spender,
                    firmwareVersion: [major_version, minor_version, patch_version],
                });

                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Token approval' },
                        body: spenderProviderName
                            ? [[spenderProviderName]]
                            : [transformAddress(spender, 'evmTetragrams')],
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

            await test.step('Review the device fee and sign', async () => {
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    positiveEthereumAmountPattern,
                );
                const dexMaximumFee = await devicePrompt
                    .cryptoAmountWithSymbolOf('fee')
                    .innerText();

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
                await expect(tradingPage.approvalSteps.continueButton).toHaveTranslation(
                    'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL',
                );
                await expect(tradingPage.approvalSteps.continueButton).toBeDisabled();

                // Pending TXID keeps the full value in its id attribute (text is truncated).
                await expect(tradingPage.approvalSteps.transactionId).toHaveAttribute(
                    'id',
                    tradingMock.lastBroadcastTxid,
                );
                await expect(tradingPage.approvalSteps.transactionId).toHaveText(
                    AddressFormatter.format(tradingMock.lastBroadcastTxid, {
                        format: 'long',
                        isChunked: false,
                    }),
                );
                await tradingPage.approvalSteps.transactionId.click();
                await expect(tradingPage.transactionDetailModalTxid).toHaveText(
                    tradingMock.lastBroadcastTxid,
                );
            });
        },
    );
});
