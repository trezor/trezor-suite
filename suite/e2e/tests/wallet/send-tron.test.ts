import { localizeNumber } from '@suite-common/wallet-utils';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { Model } from '@trezor/trezor-user-env-link';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

const RECIPIENT_ADDRESS = 'TBDWCQLHSHrrm62UefefTaK3GXetm1mJQv';
const TRANSFORMED_ADDRESS = transformAddress(RECIPIENT_ADDRESS);
const SEND_AMOUNT = '1.5';
const FORMATTED_SEND_AMOUNT = `${localizeNumber(SEND_AMOUNT)} TRX`;

test.describe('Send - Tron', { tag: ['@T3W1', '@T3T1', '@smoke'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(async ({ onboardingPage, dashboardPage, walletPage, settingsPage, page }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.experimentalFeaturesSwitch.click();
        await page.getByTestId('@settings/experimental-features/tron-view-only-checkbox').click();
        await settingsPage.changeNetworks({
            enableNetworks: ['trx'],
            disableNetworks: ['btc'],
        });
        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
        await walletPage.openAccount({ symbol: 'trx', type: 'normal', atIndex: 0 });
    });

    test(
        'Tron send with bandwidth used',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can initiate a TRX send transaction.',
                category: TestCategory.Coins,
                priority: TestPriority.High,
                stream: TestStream.NotDefined,
            }),
        },
        async ({ device, devicePrompt, walletPage, tradingPage }) => {
            await test.step('Fill in a Send form', async () => {
                await walletPage.openSendFormButton.click();
                await expect(walletPage.sendForm).toBeVisible();
                await tradingPage.sendAddressInput.fill(RECIPIENT_ADDRESS);
                await tradingPage.sendAmountInput.fill(SEND_AMOUNT);
                await expect(tradingPage.tronActivationFee).toBeVisible();
                await expect(tradingPage.sendButton).toBeEnabled();
            });

            await test.step('Verify Recipient address on device', async () => {
                await tradingPage.sendButton.click();
                await expect(devicePrompt.headerParagraph).toContainText('Tron #1');
                await expect(device).toShowOnDisplay({
                    [Model.T3W1]: {
                        header: { title: 'Sending to' },
                        body: [TRANSFORMED_ADDRESS],
                        actions: { right_button: 'Confirm' },
                    },
                    [Model.T3T1]: {
                        header: { title: 'Sending to' },
                        body: [TRANSFORMED_ADDRESS],
                    },
                });
                // Confirm address on device to pass the verification modal
                await devicePrompt.waitForPromptAndClick();
            });

            await test.step('Verify Amount & Fee', async () => {
                await expect(devicePrompt.cryptoAmountOf('amount')).toHaveText(SEND_AMOUNT);

                const amountWrapped = device.wrapText(FORMATTED_SEND_AMOUNT, {
                    wrapByWords: true,
                });
                await expect(device).toShowOnDisplay({
                    [Model.T3W1]: {
                        header: { title: 'Send' },
                        body: [['Total amount'], amountWrapped],
                        actions: { right_button: 'Hold to sign' },
                    },
                    [Model.T3T1]: {
                        header: { title: 'Summary' },
                        body: [['Total amount'], amountWrapped],
                    },
                });
            });

            await test.step('Approve and Verify Send readiness', async () => {
                // T3T1 shows "Sign transaction / Hold to sign" screen requiring pressYes
                await devicePrompt.waitForPromptAndConfirm();
                await expect(devicePrompt.sendButton).toBeEnabled();
            });
        },
    );
});
