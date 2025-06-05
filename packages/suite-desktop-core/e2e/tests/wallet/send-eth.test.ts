import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import {
    splitStringByDisplayLimit,
    transformAddress,
} from '../../support/testExtends/customMatchers';

const sendAddress = '0xdcaB74E62b9D08a9f8Fa4A3Ccb5c46AE039C9d7C';
const formattedSendAddress = formatAddress(sendAddress);
const sendAmount = '0.008';
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;
const gasLimit = '26000';
const maxFeePerGas = '2.67674454';
const maxFeePerGasRounded = new BigNumber(maxFeePerGas).decimalPlaces(2, BigNumber.ROUND_UP);
const maxPriorityFeePerGas = '1.375641927';
const maxPriorityFeePerGasRounded = new BigNumber(maxPriorityFeePerGas).decimalPlaces(
    2,
    BigNumber.ROUND_UP,
);

test.describe('Send Eth', { tag: ['@group=wallet'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(async ({ onboardingPage, dashboardPage, walletPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: ['eth'],
            disableNetworks: ['btc'],
        });
        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
        await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
    });

    test('User can initiate ethereum sending', async ({
        devicePrompt,
        walletPage,
        tradingPage,
    }) => {
        await test.step('Fill in a Send form', async () => {
            await walletPage.openSendFormButton.click();
            // Race condition 1:5, if input is filled before form completely loads then
            // input will be cleared and test will fail. As a workaround we wait for fees to be loaded.
            await tradingPage.fees.expectEthereumFeeCalculated();
            await tradingPage.sendAddressInput.fill(sendAddress);
            await tradingPage.sendAmountInput.fill(sendAmount);
            await tradingPage.fees.switchModeButton('custom').click();
            await tradingPage.fees.ethereumFeeLimit.fill(gasLimit);
            await tradingPage.fees.ethereumMaxFeePerGas.fill(maxFeePerGas);
            await tradingPage.fees.ethereumMaxPriorityFeePerGas.fill(maxPriorityFeePerGas);
        });

        const { ethereumMaximumFee, errorMessageMaxCalculation } =
            tradingPage.fees.calculateEthereumMaxFee({
                gasLimit,
                maxFeePerGas,
            });

        await test.step('Verify Recipient address', async () => {
            await tradingPage.sendButton.click();
            await expect(devicePrompt.headerParagraph).toContainText('Ethereum #1');
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedSendAddress);
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Address', subtitle: 'Recipient' },
                body: [transformAddress(sendAddress)],
                footer: 'Tap to continue',
            });
        });

        await test.step('Verify Total including fee', async () => {
            await devicePrompt.waitForPromptAndClick();
            await expect(devicePrompt.ethereumGasLimit).toHaveText(`Gas limit: ${gasLimit}`);
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
});
