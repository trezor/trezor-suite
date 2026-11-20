import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

const recipientAddress = 'ltc1q0lqwsyygg9frql6ujjfhevfculsxwledvv6yzc';

test.describe(
    'LTC send form with mocked blockbook',
    { tag: ['@T3W1', '@T3T1', '@optional'] },
    () => {
        test.use({
            deviceSetup: {
                mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
            },
        });

        test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();

            await settingsPage.navigateTo('coins');
            await blockbookMock.start('ltc');

            await settingsPage.changeNetworks({
                enableNetworks: [
                    {
                        symbol: asNetworkSymbol('ltc'),
                        backend: { type: 'blockbook', url: blockbookMock.url },
                    },
                ],
            });
        });

        test(
            'spend output originating from mimble-wimble peg out tx',
            { annotation: createTestAnnotation({ stream: TestStream.Network }) },
            async ({ page, devicePrompt, walletPage, tradingPage, device }) => {
                await walletPage.openAccount({
                    symbol: asNetworkSymbol('ltc'),
                    type: 'normal',
                    atIndex: 0,
                });
                await walletPage.openSendFormButton.click();
                await page.getByTestId('@send/header-dropdown').click();
                await page.getByTestId('@send/header-dropdown/broadcast').click();
                await tradingPage.sendAddressInput.fill(recipientAddress);
                await page.getByTestId('outputs.0.setMax').click();
                await tradingPage.sendButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
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
                await devicePrompt.waitForPromptAndConfirm();
            },
        );
    },
);
