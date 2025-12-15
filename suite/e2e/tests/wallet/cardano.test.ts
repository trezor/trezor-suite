import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { cardanoAccountDetails } from '../../snapshots/web/wallet/cardano.test.ts/cardano-aria';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const receiveAddress =
    'addr1q8y96gsk7dh870g7zhzj7d62yv9qasjqdkpvmq93u8aaxzgfey0wtrgp5rmxvld7khc745x9mk7gts5ctuzerlf4edrqz4fyst';

// todo: setup emu with 24 words mnemonic so that we can test different cardano derivation and its 'auto-discovery; feature
//mnemonic: 'clot trim improve bag pigeon party wave mechanic beyond clean cake maze protect left assist carry guitar bridge nest faith critic excuse tooth dutch',

test.describe('Cardano', { tag: ['@group=wallet', '@snapshot'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['ada'], disableNetworks: ['btc'] });
    });

    test(
        'Basic cardano walkthrough',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can successfully discover a Cardano account.',
                category: TestCategory.ADA,
                priority: TestPriority.Medium,
                stream: TestStream.Trends,
            }),
        },
        async (
            { page, dashboardPage, devicePrompt, settingsPage, walletPage, trezorUserEnvLink },
            testInfo,
        ) => {
            await test.step('Verify Cardano account details', async () => {
                await dashboardPage.navigateTo();
                await walletPage.openAccount({ symbol: 'ada' });
                await walletPage.accountDetailsTabButton.click();
                await expect(walletPage.accountDetails).toMatchAriaSnapshot(
                    cardanoAccountDetails(testInfo.project.name),
                );
            });

            await test.step('Verify public key', async () => {
                await walletPage.showPublicKeyButton.click();
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
                await walletPage.revealAddressButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(devicePrompt).toDisplayReceiveAddress(receiveAddress, {
                    lineFormat: 'fullLine',
                });
                await trezorUserEnvLink.pressYes();
                await expect(walletPage.copyAddressButton).toBeEnabled();
                await expect(devicePrompt.outputValue).toHaveText(formatAddress(receiveAddress));
                await devicePrompt.confirmOnDevicePromptIsShown();
                await settingsPage.modalCloseButton.click();
                await page.getByTestId('@account-subpage/back').click();
            });
        },
    );
});
