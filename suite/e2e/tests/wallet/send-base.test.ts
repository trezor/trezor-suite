import { localizeNumber } from '@suite-common/wallet-utils';
import messages from '@trezor/suite/src/support/messages';
import { BigNumber } from '@trezor/utils';

import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import {
    splitStringByDisplayLimit,
    transformAddress,
} from '../../support/testExtends/customMatchers';

const networkName = 'Base #1';
const sendAddress = '0xdcaB74E62b9D08a9f8Fa4A3Ccb5c46AE039C9d7C';
const formattedSendAddress = formatAddress(sendAddress);
const sendAmount = '0.000008';
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;

test.describe('Send Base', { tag: ['@group=wallet', '@nightlyOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(async ({ onboardingPage, dashboardPage, walletPage, settingsPage, page }) => {
        await page.clock.install();
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: ['base'], //add more EVMs
            disableNetworks: ['btc'],
        });
        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
        await walletPage.openAccount({ symbol: 'base', type: 'normal', atIndex: 0 });
    });

    test('User can set custom fees', async ({ devicePrompt, walletPage, tradingPage }) => {
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
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedSendAddress);
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Address', subtitle: 'Recipient' },
                body: [transformAddress(sendAddress)],
                footer: 'Tap to continue',
            });
        });

        await test.step('Verify Total including fee', async () => {
            await devicePrompt.waitForPromptAndClick();
            const gasLimitTranslation = `${messages['TR_GAS_LIMIT'].defaultMessage}: ${gasLimit}`;
            await expect(devicePrompt.ethereumGasLimit).toHaveText(gasLimitTranslation);
            await expect(devicePrompt.ethereumFeeRate).toHaveText(`${maxFeePerGasRounded} Gwei`);
            await expect(devicePrompt.ethereumPriorityFeeRate).toHaveText(
                `${maxPriorityFeePerGasRounded} Gwei`,
            );
            await expect(devicePrompt.cryptoAmountOf('amount')).toHaveText(sendAmount);
            await expect(devicePrompt.cryptoAmountOf('fee'), errorMessageMaxCalculation).toHaveText(
                ethereumMaximumFee,
            );
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Summary' },
                body: [
                    ['Amount'],
                    [formattedSendAmount],
                    [' '],
                    ['Maximum fee'],
                    splitStringByDisplayLimit(`${ethereumMaximumFee} ETH`),
                ],
                footer: 'Tap to continue',
            });
        });

        await test.step('Verify Fee Info on emulator', async () => {
            await tradingPage.fees.openFeeInfoOnEmulator();
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Fee info' },
                body: [
                    ['Gas limit'],
                    [`${gasLimit} units`],
                    [' '],
                    ['Max fee per gas'],
                    [`${maxFeePerGas} Gwei`],
                    [' '],
                    ['Max priority fee'],
                    [`${maxPriorityFeePerGas} Gwei`],
                ],
            });
        });
    });

    test('User can perform ethereum sending on base network', async ({
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
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedSendAddress);
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Address', subtitle: 'Recipient' },
                body: [transformAddress(sendAddress)],
                footer: 'Tap to continue',
            });
        });

        await test.step('Verify Total including fee', async () => {
            await devicePrompt.waitForPromptAndClick();
            const gasLimitTranslation = `${messages['TR_GAS_LIMIT'].defaultMessage}: ${gasLimit}`;
            await expect(devicePrompt.ethereumGasLimit).toHaveText(gasLimitTranslation);
            await expect(devicePrompt.ethereumFeeRate).toHaveText(`${maxFeePerGasRounded} Gwei`);
            await expect(devicePrompt.ethereumPriorityFeeRate).toHaveText(
                `${maxPriorityFeePerGasRounded} Gwei`,
            );
            await expect(devicePrompt.cryptoAmountOf('amount')).toHaveText(sendAmount);
            await expect(devicePrompt.cryptoAmountOf('fee'), errorMessageMaxCalculation).toHaveText(
                ethereumMaximumFee,
            );
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Summary' },
                body: [
                    ['Amount'],
                    [formattedSendAmount],
                    [' '],
                    ['Maximum fee'],
                    splitStringByDisplayLimit(`${ethereumMaximumFee} ETH`),
                ],
                footer: 'Tap to continue',
            });
        });

        await test.step('Verify Fee Info on emulator', async () => {
            await tradingPage.fees.openFeeInfoOnEmulator();
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Fee info' },
                body: [
                    ['Gas limit'],
                    [`${gasLimit} units`],
                    [' '],
                    ['Max fee per gas'],
                    [`${maxFeePerGas} Gwei`],
                    [' '],
                    ['Max priority fee'],
                    [`${maxPriorityFeePerGas} Gwei`],
                ],
            });
        });
        await test.step('Confirm transaction', async () => {
            await devicePrompt.waitForPromptAndConfirm();
            await devicePrompt.sendButton.click();
            await page.getByTestId('@toast/tx-sent').click();
            await page.getByRole('button', { name: 'View details' }).click();

            // Transaction takes ~5s to confirm on the network, but we need to pull
            // for updated data and check status repeatedly until confirmed
            await expect(async () => {
                await page.clock.fastForward(30_000);

                await expect(page.getByTestId('@modal/tx-details/confirmed')).toHaveText(
                    'Confirmed',
                );
            }).toPass({ timeout: 30_000 });
        });
    });
});
