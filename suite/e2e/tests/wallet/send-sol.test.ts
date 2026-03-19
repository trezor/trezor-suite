import { getNetwork } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { Model } from '@trezor/trezor-user-env-link';
import { BigNumber } from '@trezor/utils';

import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

const RECIPIENT_ADDRESS = 'ENk2eeP4umP6cjAGRsVG4NEVKEVQmRn6JEpN8hubv2Hf';
const FORMATTED_ADDRESS = formatAddressWithNewlines(RECIPIENT_ADDRESS);
const TRANSFORMED_ADDRESS = transformAddress(RECIPIENT_ADDRESS, 'fullLine');
const SOL_DECIMALS = getNetwork('sol').decimals;

test.describe('Send - Solana', { tag: ['@webOnly', '@T3T1', '@T3W1', '@smoke'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'mnemonic_academic',
            passphrase_protection: true,
        },
    });

    test.beforeEach(async ({ settingsPage, onboardingPage, dashboardPage, walletPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: ['sol'],
            disableNetworks: ['btc'],
        });
        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
        await walletPage.openAccount({ symbol: 'sol', type: 'normal', atIndex: 0 });
    });

    test(
        'Send max',
        {
            annotation: createTestAnnotation({
                testCase: 'Send Max functionality verification',
                category: TestCategory.Solana,
                priority: TestPriority.High,
                stream: TestStream.NotDefined,
            }),
        },
        async ({ page, device, walletPage, tradingPage, devicePrompt }) => {
            let maxFee: number;
            let sendMaxAmountWithReserve: string;

            await test.step('Navigate to Solana Send form', async () => {
                await walletPage.openSendFormButton.click();

                await expect(walletPage.sendForm).toBeVisible();
                await expect(tradingPage.sendButton).toBeDisabled();
            });

            await test.step('Fill recipient address, toggle Send Max & verify calculation', async () => {
                await tradingPage.sendAddressInput.fill(RECIPIENT_ADDRESS);
                await tradingPage.setMax.click();

                await expect(tradingPage.fees.maxFee).not.toBeEmpty();

                const balance = Number(await tradingPage.sendBalance.textContent());
                maxFee = Number(await tradingPage.fees.maxFee.textContent());
                const reservedAmount = await tradingPage.fees.getNetworkReserveAmount();
                sendMaxAmountWithReserve = localizeNumber(
                    new BigNumber(balance - maxFee - reservedAmount),
                    'en-US',
                    0,
                    SOL_DECIMALS,
                );
                await expect(tradingPage.sendAmountInput).toHaveValue(sendMaxAmountWithReserve);
                const expectedTotalSent = localizeNumber(
                    new BigNumber(balance - reservedAmount),
                    'en-US',
                    0,
                    SOL_DECIMALS,
                );
                await expect(walletPage.totalSent).toHaveText(expectedTotalSent);
                await expect(tradingPage.sendButton).toBeEnabled();
            });

            await test.step('Trigger Review & Send Modal', async () => {
                await tradingPage.sendButton.click();

                await expect(page.modal).toBeVisible();
                await expect(devicePrompt.sendButton).toBeDisabled();
            });

            await test.step('Verify Recipient Address', async () => {
                await expect(devicePrompt.headerParagraph).toContainText('Solana #1');
                await expect(devicePrompt.outputValueOf('address')).toHaveText(FORMATTED_ADDRESS);

                // verify recipient address on device
                await expect(device).toShowOnDisplay({
                    [Model.T3W1]: {
                        header: { title: 'Recipient' },
                        body: [TRANSFORMED_ADDRESS],
                        actions: {
                            right_button: 'Continue',
                        },
                    },
                });

                // confirm address
                await devicePrompt.waitForPromptAndClick();
            });

            await test.step('Verify Amount & Transaction Fee', async () => {
                await expect(devicePrompt.cryptoAmountOf('total')).toHaveText(
                    sendMaxAmountWithReserve,
                );
                await expect(devicePrompt.cryptoAmountOf('fee')).toHaveText(maxFee.toString());

                // verify amount & fee
                const amountWrapped = device.wrapText(`${sendMaxAmountWithReserve} SOL`, {
                    wrapByWords: true,
                });
                await expect(device).toShowOnDisplay({
                    [Model.T3W1]: {
                        header: { title: 'Send' },
                        body: [
                            ['Amount:'],
                            amountWrapped,
                            ['Transaction fee'],
                            device.wrapText(`${maxFee} SOL`, { wrapByWords: true }),
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                    [Model.T3T1]: {
                        header: { title: 'Summary' },
                    },
                });

                // confirm amount & fee
                await devicePrompt.waitForPromptAndClick();
            });

            await test.step('Approve and Verify Send readiness', async () => {
                // hold & sign
                if (device.model !== Model.T3W1) {
                    await devicePrompt.waitForPromptAndClick();
                }

                await expect(devicePrompt.sendButton).toBeEnabled();
            });
        },
    );
});
