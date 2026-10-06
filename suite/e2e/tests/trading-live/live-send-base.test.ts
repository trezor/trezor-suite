import { AddressFormatter } from '@suite-common/formatters';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';
import { BigNumber, localizeNumber } from '@trezor/utils';

import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

const networkName = 'Base #1';
const sendAddress = '0xdcaB74E62b9D08a9f8Fa4A3Ccb5c46AE039C9d7C';
const formattedSendAddress = formatAddressWithNewlines(sendAddress);
const sendAmount = '0.000008';
const tokenName = 'BasedPepe';
const tokenSymbol = 'PEPE';
const tokenContractAddress = '0x52b492a33e447cdb854c7fc19f1e57e8bfa1777d';
const displayedTokenContractAddress = AddressFormatter.format(tokenContractAddress, {
    format: 'long',
});
const tokenSendAmount = '1253891.123456';
const localizedTokenSendAmount = localizeNumber(tokenSendAmount);
const formattedTokenSendAmount = `${localizedTokenSendAmount} ${tokenSymbol}`;
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;
const feeWrapFormat = {
    wrapByWords: true,
    lengthOverride: 16,
};

// The PEPE send is declared after the Base ETH send. Tests in this file run in
// that order on one worker, so the token transaction spends the nonce after the
// ETH send. @optional keeps it out of the full PR run; it still runs nightly and
// on a PR that edits or is related to this file.
test.describe(
    'Live - Send Base',
    { tag: ['@desktopOnly', '@optional', '@T3W1', '@specificFirmware'] },
    () => {
        test.use({
            deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
        });

        test.beforeEach(
            async ({ page, onboardingPage, dashboardPage, walletPage, settingsPage }) => {
                await page.clock.install();
                await onboardingPage.completeOnboarding();
                await settingsPage.changeNetworks({ enableNetworks: [asNetworkSymbol('base')] }); //add more EVMs
                await dashboardPage.deviceSwitchingOpenButton.click();
                await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
                await walletPage.openAccount({
                    symbol: asNetworkSymbol('base'),
                    type: 'normal',
                    atIndex: 0,
                });
            },
        );

        test(
            'User can set custom fees',
            { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
            async ({ device, devicePrompt, walletPage, tradingPage }) => {
                const gasLimit = '26000';
                const maxFeePerGas = '0.67674454';
                const maxFeePerGasRounded = new BigNumber(maxFeePerGas).decimalPlaces(
                    4,
                    BigNumber.ROUND_UP,
                ); // beware of decimal places rounding
                const maxPriorityFeePerGas = '0.375641927';
                const maxPriorityFeePerGasRounded = new BigNumber(
                    maxPriorityFeePerGas,
                ).decimalPlaces(
                    4, // beware of decimal places rounding
                    BigNumber.ROUND_UP,
                );

                await test.step('Fill in a Send form', async () => {
                    await walletPage.openSendFormButton.click();
                    await tradingPage.sendAddressInput.fill(sendAddress);
                    await tradingPage.sendAmountInput.fill(sendAmount);
                    await tradingPage.fees.setEthereumCustomFees({
                        gasLimit,
                        maxFeePerGas,
                        maxPriorityFeePerGas,
                    });
                });

                const { ethereumMaximumFee, errorMessageMaxCalculation } =
                    tradingPage.fees.calculateEthereumMaxFee({
                        gasLimit,
                        maxFeePerGas,
                    });

                await test.step('Verify Recipient address', async () => {
                    await tradingPage.sendButton.click();
                    await expect(devicePrompt.header.accountLabel).toHaveText(networkName);
                    await expect(devicePrompt.outputValueOf('address')).toHaveText(
                        formattedSendAddress,
                    );
                    await expect(device).toShowOnDisplay({
                        T3W1: {
                            header: { title: 'Send' },
                            body: [transformAddress(sendAddress, 'evmTetragrams')],
                            actions: { right_button: 'Continue' },
                        },
                    });
                });

                await test.step('Verify Total including fee', async () => {
                    await devicePrompt.waitForPromptAndClick();
                    await expect(devicePrompt.header.gasLimitValue).toHaveText(gasLimit);
                    await expect(devicePrompt.header.feePerGasValue).toHaveText(
                        `${maxFeePerGasRounded}`,
                    );
                    await expect(devicePrompt.header.priorityFeeValue).toHaveText(
                        `${maxPriorityFeePerGasRounded}`,
                    );
                    await expect(devicePrompt.cryptoAmountOf('amount')).toHaveText(sendAmount);
                    await expect(
                        devicePrompt.cryptoAmountOf('fee'),
                        errorMessageMaxCalculation,
                    ).toHaveText(ethereumMaximumFee);
                    await expect(device).toShowOnDisplay({
                        T3W1: {
                            header: { title: 'Send' },
                            body: [
                                ['Amount'],
                                [formattedSendAmount],
                                ['Maximum fee'],
                                device.wrapText(`${ethereumMaximumFee} ETH`, { isAmount: true }),
                            ],
                            actions: { right_button: 'Hold to sign' },
                        },
                    });
                });

                await test.step('Verify Fee Info on emulator', async () => {
                    await device.openFeeInfo();
                    await expect(device).toShowOnDisplay({
                        T3W1: {
                            header: { title: 'Fee info' },
                            body: [
                                ['Gas limit'],
                                [`${gasLimit} units`],
                                ['Max fee per gas'],
                                device.wrapText(`${maxFeePerGas} Gwei`, feeWrapFormat),
                                ['Max priority fee'],
                                device.wrapText(`${maxPriorityFeePerGas} Gwei`, feeWrapFormat),
                            ],
                        },
                    });
                });
            },
        );

        test(
            'User can perform ethereum sending on base network',
            { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
            async ({ device, devicePrompt, walletPage, tradingPage, page }) => {
                await test.step('Fill in a Send form', async () => {
                    await walletPage.openSendFormButton.click();
                    await tradingPage.sendAddressInput.fill(sendAddress);
                    await tradingPage.sendAmountInput.fill(sendAmount);
                });

                const {
                    gasLimit,
                    maxFeePerGas,
                    maxPriorityFeePerGas,
                    maxFeePerGasRounded,
                    maxPriorityFeePerGasRounded,
                } = await tradingPage.fees.getStandardFeeWorkaround();
                const { ethereumMaximumFee, errorMessageMaxCalculation } =
                    tradingPage.fees.calculateEthereumMaxFee({
                        gasLimit,
                        maxFeePerGas,
                        numberOfDecimals: 15,
                    });

                await test.step('Verify Recipient address', async () => {
                    await tradingPage.sendButton.click();
                    await expect(devicePrompt.header.accountLabel).toHaveText(networkName);
                    await expect(devicePrompt.outputValueOf('address')).toHaveText(
                        formattedSendAddress,
                    );
                    await expect(device).toShowOnDisplay({
                        T3W1: {
                            header: { title: 'Send' },
                            body: [transformAddress(sendAddress, 'evmTetragrams')],
                            actions: { right_button: 'Continue' },
                        },
                    });
                });

                await test.step('Verify Total including fee', async () => {
                    await devicePrompt.waitForPromptAndClick();
                    await expect(devicePrompt.header.gasLimitValue).toHaveText(gasLimit);
                    await expect(devicePrompt.header.feePerGasValue).toHaveText(
                        `${maxFeePerGasRounded}`,
                    );
                    await expect(devicePrompt.header.priorityFeeValue).toHaveText(
                        `${maxPriorityFeePerGasRounded}`,
                    );
                    await expect(devicePrompt.cryptoAmountOf('amount')).toHaveText(sendAmount);
                    await expect(
                        devicePrompt.cryptoAmountOf('fee'),
                        errorMessageMaxCalculation,
                    ).toHaveText(ethereumMaximumFee);
                    const maxFeeWrapped = device.wrapText(`${ethereumMaximumFee} ETH`, {
                        isAmount: true,
                    });
                    await expect(device).toShowOnDisplay({
                        T3W1: {
                            header: { title: 'Send' },
                            body: [
                                ['Amount'],
                                [formattedSendAmount],
                                ['Maximum fee'],
                                maxFeeWrapped,
                            ],
                            actions: { right_button: 'Hold to sign' },
                        },
                    });
                });

                await test.step('Verify Fee Info on emulator', async () => {
                    await device.openFeeInfo();
                    await expect(device).toShowOnDisplay({
                        T3W1: {
                            header: { title: 'Fee info' },
                            body: [
                                ['Gas limit'],
                                [`${gasLimit} units`],
                                ['Max fee per gas'],
                                device.wrapText(`${maxFeePerGas} Gwei`, feeWrapFormat),
                                ['Max priority fee'],
                                device.wrapText(`${maxPriorityFeePerGas} Gwei`, feeWrapFormat),
                            ],
                        },
                    });
                });

                await test.step('Confirm transaction', async () => {
                    await devicePrompt.waitForPromptAndConfirm();
                    // wait for transaction to be prepared
                    await page.expectReduxObjectToEqual('wallet.send.serializedTx.symbol', 'base');
                    await devicePrompt.sendButton.click();
                    await page.getByTestId('@toast/tx-sent').click();
                    await page.getByRole('button', { name: 'View details' }).hover();
                    // wait for transaction to be processed in Suite before navigating to its detail
                    await page.expectReduxObjectToEqual('wallet.send.drafts', {});
                    await page.getByRole('button', { name: 'View details' }).click();

                    // Transaction takes ~5s to confirm on the network, but we need to pull
                    // for updated data and check status repeatedly until confirmed
                    await expect(async () => {
                        await page.clock.fastForward(30_000);

                        await expect(page.getByTestId('@modal/tx-details/confirmed')).toHaveText(
                            'Confirmed',
                        );
                    }, 'expect Transaction to be confirmed').toPass({ timeout: 30_000 });
                });
            },
        );

        test(
            'User can perform token send sending on base network',
            { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
            async ({ device, devicePrompt, walletPage, tradingPage, page, toastSection }) => {
                await test.step('Fill in a Send form', async () => {
                    await walletPage.openSendFormButton.click();
                    await walletPage.selectSendToken({
                        networkSymbol: asNetworkSymbol('base'),
                        tokenSymbol,
                    });
                    await expect(walletPage.selectedSendTokenName).toHaveText(tokenName);
                    await expect(walletPage.selectedSendToken).toHaveText(
                        new RegExp(`${tokenSymbol}$`),
                    );
                    await expect(walletPage.selectedSendTokenContract).toHaveText(
                        displayedTokenContractAddress,
                    );
                    await expect(walletPage.selectedSendTokenContract).toHaveAttribute(
                        'id',
                        tokenContractAddress,
                    );
                    await tradingPage.sendAddressInput.fill(sendAddress);
                    await tradingPage.sendAmountInput.fill(tokenSendAmount);
                });

                const {
                    gasLimit,
                    maxFeePerGas,
                    maxPriorityFeePerGas,
                    maxFeePerGasRounded,
                    maxPriorityFeePerGasRounded,
                } = await tradingPage.fees.getStandardFeeWorkaround();
                const { ethereumMaximumFee, errorMessageMaxCalculation } =
                    tradingPage.fees.calculateEthereumMaxFee({
                        gasLimit,
                        maxFeePerGas,
                        numberOfDecimals: 18,
                    });

                await test.step('Verify Recipient address', async () => {
                    await tradingPage.sendButton.click();
                    await expect(devicePrompt.header.accountLabel).toHaveText(networkName);
                    await expect(devicePrompt.outputValueOf('address')).toHaveText(
                        formattedSendAddress,
                    );
                    await expect(device).toShowOnDisplay({
                        T3W1: {
                            header: { title: 'Send' },
                            body: [transformAddress(sendAddress, 'evmTetragrams')],
                            actions: { right_button: 'Continue' },
                        },
                    });
                });

                await test.step('Verify Total including fee', async () => {
                    await devicePrompt.waitForPromptAndClick();
                    await expect(devicePrompt.header.gasLimitValue).toHaveText(gasLimit);
                    await expect(devicePrompt.header.feePerGasValue).toHaveText(
                        `${maxFeePerGasRounded}`,
                    );
                    await expect(devicePrompt.header.priorityFeeValue).toHaveText(
                        `${maxPriorityFeePerGasRounded}`,
                    );
                    await expect(devicePrompt.cryptoAmountOf('amount')).toHaveText(
                        localizedTokenSendAmount,
                    );
                    await expect(
                        devicePrompt.cryptoAmountOf('fee'),
                        errorMessageMaxCalculation,
                    ).toHaveText(ethereumMaximumFee);
                    const amountWrapped = device.wrapText(formattedTokenSendAmount, {
                        isAmount: true,
                    });
                    const maxFeeWrapped = device.wrapText(`${ethereumMaximumFee} ETH`, {
                        isAmount: true,
                    });
                    await expect(device).toShowOnDisplay({
                        T3W1: {
                            header: { title: 'Send' },
                            body: [['Amount'], amountWrapped, ['Maximum fee'], maxFeeWrapped],
                            actions: { right_button: 'Hold to sign' },
                        },
                    });
                });

                await test.step('Verify Fee Info on emulator', async () => {
                    await device.openFeeInfo();
                    await expect(device).toShowOnDisplay({
                        T3W1: {
                            header: { title: 'Fee info' },
                            body: [
                                ['Gas limit'],
                                [`${gasLimit} units`],
                                ['Max fee per gas'],
                                device.wrapText(`${maxFeePerGas} Gwei`, feeWrapFormat),
                                ['Max priority fee'],
                                device.wrapText(`${maxPriorityFeePerGas} Gwei`, feeWrapFormat),
                            ],
                        },
                    });
                });

                await test.step('Confirm transaction', async () => {
                    await devicePrompt.waitForPromptAndConfirm();
                    // wait for transaction to be prepared
                    await page.expectReduxObjectToEqual('wallet.send.serializedTx.symbol', 'base');
                    await devicePrompt.sendButton.click();
                    await expect(walletPage.pendingTransactionHeading).toHaveTranslation(
                        'TR_UNCONFIRMED_TX_LONG',
                    );
                    await toastSection.verifyTxSentToast({
                        account: networkName,
                        amount: formattedTokenSendAmount,
                    });
                    await page.getByTestId('@toast/tx-sent').click();
                    await page.getByRole('button', { name: 'View details' }).hover();
                    // wait for transaction to be processed in Suite before navigating to its detail
                    await page.expectReduxObjectToEqual('wallet.send.drafts', {});
                    await page.getByRole('button', { name: 'View details' }).click();

                    // Transaction takes ~5s to confirm on the network, but we need to pull
                    // for updated data and check status repeatedly until confirmed
                    await expect(async () => {
                        await page.clock.fastForward(30_000);

                        await expect(page.getByTestId('@modal/tx-details/confirmed')).toHaveText(
                            'Confirmed',
                        );
                    }, 'expect Transaction to be confirmed').toPass({ timeout: 30_000 });
                    await expect(
                        walletPage.transactionDetailTokenAmount(tokenContractAddress),
                    ).toHaveText(`–${formattedTokenSendAmount}`);
                });
            },
        );
    },
);
