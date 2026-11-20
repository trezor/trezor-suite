import { messages } from '@suite/intl';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';
import { localizeNumber } from '@trezor/utils';

import { formatAddressWithNewlines, replaceTemplatesInTranslation } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

const signTxErrorMessage = replaceTemplatesInTranslation(
    messages.TOAST_SIGN_TX_ERROR.defaultMessage,
    { error: 'Invalid amount specified' },
);

test.describe('Doge Send', { tag: ['@T3W1', '@T3T1', '@optional'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic:
                'fantasy auto fancy access ring spring patrol expect common tape talent annual',
        },
        ignoreToastErrors: [signTxErrorMessage],
    });

    const recipientAddress = 'DJk8vtoEuNGtT4YRNoqVxWyRh6kM3s8bzc';
    const sendAmount = '115568568500';
    const feeAmount = '0.01450643';
    const totalAmount = '115,568,568,500.01450643';

    test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock }) => {
        await blockbookMock.start('doge');
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('coins');
        await settingsPage.changeNetworks({
            enableNetworks: [
                {
                    symbol: asNetworkSymbol('doge'),
                    backend: { type: 'blockbook', url: blockbookMock.url },
                },
            ],
        });
    });

    test(
        'Cannot send amount exceeding MAX_SAFE_INTEGER',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, device, walletPage, tradingPage, devicePrompt }) => {
            await test.step('Open send form for Doge', async () => {
                await walletPage.openAccount({ symbol: asNetworkSymbol('doge') });
                await walletPage.openSendFormButton.click();
            });

            await test.step('Fill amount over MAX_SAFE_INTEGER and send', async () => {
                await page.getByTestId('@send/header-dropdown').click();
                await page.getByTestId('@send/header-dropdown/broadcast').click();
                await tradingPage.sendAddressInput.fill(recipientAddress);
                await tradingPage.sendAmountInput.fill(sendAmount);
                await tradingPage.sendButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
            });

            await test.step('Verify info on modals and confirm', async () => {
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [transformAddress(recipientAddress, 'fourTetragrams')],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        header: { title: 'Address', subtitle: 'Recipient #1' },
                    },
                });
                await device.pressYes();
                await expect(devicePrompt.outputValueOf('amount')).toContainText(
                    `${localizeNumber(sendAmount)} DOGE`,
                );
                await expect(devicePrompt.outputValueOf('total')).toContainText(
                    `${totalAmount} DOGE`,
                );
                await expect(devicePrompt.outputValueOf('fee')).toContainText(`${feeAmount} DOGE`);
                await expect(devicePrompt.outputValueOf('address')).toHaveText(
                    formatAddressWithNewlines(recipientAddress),
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [
                            ['Amount'],
                            device.wrapText(`${localizeNumber(sendAmount)} DOGE`, {
                                isAmount: true,
                            }),
                        ],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        header: { title: 'Amount', subtitle: 'Recipient #1' },
                        body: [
                            device.wrapText(`${localizeNumber(sendAmount)} DOGE`, {
                                isAmount: true,
                            }),
                        ],
                    },
                });
                await device.pressYes();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [
                            ['Total amount'],
                            device.wrapText(`${totalAmount} DOGE`, { isAmount: true }),
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                    T3T1: {
                        header: { title: 'Summary' },
                        body: [
                            ['Total amount'],
                            device.wrapText(`${totalAmount} DOGE`, { isAmount: true }),
                            ['incl. Transaction fee'],
                            [`${feeAmount} DOGE`],
                        ],
                    },
                });
                await device.pressYes();
            });

            await expect(page.getByTestId('@toast/sign-tx-error')).toHaveText(signTxErrorMessage);
        },
    );
});
