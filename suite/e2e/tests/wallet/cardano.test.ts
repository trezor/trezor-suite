import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { T3T1_FIRST_PAGE_KEY_LENGTH } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

const receiveAddress =
    'addr1q8y96gsk7dh870g7zhzj7d62yv9qasjqdkpvmq93u8aaxzgfey0wtrgp5rmxvld7khc745x9mk7gts5ctuzerlf4edrqz4fyst';
const publicKey =
    'c1c2071bfdbef93ca1d629b3e12f49caec1fb846dcd57029c1847691ccb7409d66b64d59ebbcf36afcbb66a0d6a4685e168b82c823ca5f270105f601306f1163';

// todo: setup emu with 24 words mnemonic so that we can test different cardano derivation and its 'auto-discovery; feature
//mnemonic: 'clot trim improve bag pigeon party wave mechanic beyond clean cake maze protect left assist carry guitar bridge nest faith critic excuse tooth dutch',

test.describe('Cardano', { tag: ['@optional', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: [asNetworkSymbol('ada')] });
    });

    test(
        'Basic cardano walkthrough',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can successfully discover a Cardano account.',
                category: TestCategory.ADA,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async ({ page, device, dashboardPage, devicePrompt, settingsPage, walletPage }) => {
            await test.step('Verify Cardano account details', async () => {
                await dashboardPage.navigateTo();
                await walletPage.openAccount({ symbol: asNetworkSymbol('ada') });
                await walletPage.accountDetailsTabButton.click();
                await expect(walletPage.accountDetails).toContainTranslation(
                    'TR_ACCOUNT_TYPE_NORMAL_CARDANO_DESC',
                );
                await expect(walletPage.accountDetails).toContainTranslation(
                    'TR_ACCOUNT_DETAILS_PATH_DESC',
                );
                await expect(walletPage.accountDetails).toContainTranslation(
                    'TR_ACCOUNT_DETAILS_XPUB',
                );
            });

            await test.step('Verify public key', async () => {
                await walletPage.showPublicKeyButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Public key' },
                        body: [transformAddress(publicKey, 'fullLine')],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        body: [
                            [
                                ...device.wrapText(publicKey.slice(0, T3T1_FIRST_PAGE_KEY_LENGTH)),
                                '...',
                            ],
                        ],
                    },
                });
                await devicePrompt.waitForPromptAndConfirm();
                await expect(walletPage.copyPublicKeyButton).toBeEnabled();
                await settingsPage.modalCloseButton.click();
            });

            await test.step('Verify Cardano send form', async () => {
                await walletPage.openSendFormButton.click();
                await expect(walletPage.sendForm).toContainText('Cardano');
                await page.getByTestId('@account-subpage/back').click();
            });

            await test.step('Verify Cardano receive form', async () => {
                await walletPage.receiveButton.click();
                await walletPage.verifyAddressButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowReceiveAddress(receiveAddress, {
                    lineFormat: 'cardanoTetragrams',
                });
                await device.pressYes();
                await expect(walletPage.copyAddressButton).toBeEnabled();
                await page.getByTestId('@account-subpage/back').click();
            });
        },
    );
});
