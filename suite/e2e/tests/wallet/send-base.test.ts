import { messages } from '@suite/intl';
import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

const networkName = 'Base #1';
const sendAddress = '0xdcaB74E62b9D08a9f8Fa4A3Ccb5c46AE039C9d7C';
const formattedSendAddress = formatAddressWithNewlines(sendAddress);
const sendAmount = '0.000008';
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;
const feeWrapFormat = {
    wrapByWords: true,
    lengthOverride: 16,
};

// This test is vulnerable to being run twice simultaneously
// in such case nonce will collide and second transaction will fail
// To avoid this, we tag this way to unsure it runs only once per night
test.describe(
    'Send Base',
    { tag: ['@desktopOnly', '@nightlyOnly', '@T3W1', '@specificFirmware'] },
    () => {
        test.use({
            deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
        });

        test.beforeEach(
            async ({ page, onboardingPage, dashboardPage, walletPage, settingsPage }) => {
                await page.clock.install();
                await onboardingPage.completeOnboarding();
                await settingsPage.changeNetworks({ enableNetworks: ['base'] }); //add more EVMs
                await dashboardPage.deviceSwitchingOpenButton.click();
                await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
                await walletPage.openAccount({ symbol: 'base', type: 'normal', atIndex: 0 });
            },
        );

        test('User can set custom fees', async ({
            device,
            devicePrompt,
            walletPage,
            tradingPage,
        }) => {
            const gasLimit = '26000';
            const maxFeePerGas = '0.67674454';
            const maxFeePerGasRounded = new BigNumber(maxFeePerGas).decimalPlaces(
                4,
                BigNumber.ROUND_UP,
            ); // beware of decimal places rounding
            const maxPriorityFeePerGas = '0.375641927';
            const maxPriorityFeePerGasRounded = new BigNumber(maxPriorityFeePerGas).decimalPlaces(
                4, // beware of decimal places rounding
                BigNumber.ROUND_UP,
            );
            await test.step('Fill in a Send form', async () => {
                await walletPage.openSendFormButton.click();
                // Race condition 1:5, if input is filled before form completely loads then
                // input will be cleared and test will fail. As a workaround we wait for fees to be loaded.
                await tradingPage.fees.expectEthereumFeeCalculated();
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
                await expect(devicePrompt.headerParagraph).toContainText(networkName);
                await expect(devicePrompt.outputValueOf('address')).toHaveText(
                    formattedSendAddress,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [transformAddress(sendAddress)],
                        actions: { right_button: 'Continue' },
                    },
                });
            });

            await test.step('Verify Total including fee', async () => {
                await devicePrompt.waitForPromptAndClick();
                const gasLimitTranslation = `${messages['TR_GAS_LIMIT'].defaultMessage}: ${gasLimit}`;
                await expect(devicePrompt.ethereumGasLimit).toHaveText(gasLimitTranslation);
                await expect(devicePrompt.ethereumFeeRate).toHaveText(
                    `${maxFeePerGasRounded} Gwei`,
                );
                await expect(devicePrompt.ethereumPriorityFeeRate).toHaveText(
                    `${maxPriorityFeePerGasRounded} Gwei`,
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
        });

        test('User can perform ethereum sending on base network', async ({
            device,
            devicePrompt,
            walletPage,
            tradingPage,
            page,
        }) => {
            await test.step('Fill in a Send form', async () => {
                await walletPage.openSendFormButton.click();
                // Race condition 1:5, if input is filled before form completely loads then
                // input will be cleared and test will fail. As a workaround we wait for fees to be loaded.
                await tradingPage.fees.expectEthereumFeeCalculated();
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
                await expect(devicePrompt.headerParagraph).toContainText(networkName);
                await expect(devicePrompt.outputValueOf('address')).toHaveText(
                    formattedSendAddress,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [transformAddress(sendAddress)],
                        actions: { right_button: 'Continue' },
                    },
                });
            });

            await test.step('Verify Total including fee', async () => {
                await devicePrompt.waitForPromptAndClick();
                const gasLimitTranslation = `${messages['TR_GAS_LIMIT'].defaultMessage}: ${gasLimit}`;
                await expect(devicePrompt.ethereumGasLimit).toHaveText(gasLimitTranslation);
                await expect(devicePrompt.ethereumFeeRate).toHaveText(
                    `${maxFeePerGasRounded} Gwei`,
                );
                await expect(devicePrompt.ethereumPriorityFeeRate).toHaveText(
                    `${maxPriorityFeePerGasRounded} Gwei`,
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
                        body: [['Amount'], [formattedSendAmount], ['Maximum fee'], maxFeeWrapped],
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
        });
    },
);
