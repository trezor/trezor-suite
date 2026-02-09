import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

import { skipFixture } from '../../../support/common';
import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';

test.describe(
    'Suite Sync - Labelling',
    { tag: ['@webOnly', '@specificFirmware', '@T3W1', '@T3T1'] },
    () => {
        test.use({
            exceptionLogger: skipFixture,
            firmwareVersion: '2-main',
            deviceSetup: {
                mnemonic: generateMnemonic(wordlist),
                passphrase_protection: true,
            },
        });

        test('Sync account label across sessions', async ({
            page,
            onboardingPage,
            settingsPage,
            walletPage,
            metadataPage,
        }) => {
            await test.step('Onboarding and enable Suite Sync', async () => {
                await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
                await metadataPage.setupQuotaManager();
                await metadataPage.enableSuiteSync();
            });

            const newLabel = 'my synced btc account label';
            await test.step('Change BTC account label in first session', async () => {
                await walletPage
                    .accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 })
                    .click();
                await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
                await metadataPage.account.metadataInput.fill(newLabel);
                await page.keyboard.press('Enter');
                await expect(
                    walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
                ).toHaveText(newLabel);

                await page.waitForTimeout(5_000); // wait for sync to complete
            });

            await test.step('Wipe Suite to simulate new session', async () => {
                await settingsPage.navigateTo('application');
                await settingsPage.resetAppButton.click();
            });

            await test.step('Onboarding and enable Suite Sync', async () => {
                await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
                await metadataPage.setupQuotaManager();
                await metadataPage.enableSuiteSync();
            });

            await test.step('Verify BTC account label is synced in second session', async () => {
                await walletPage
                    .accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 })
                    .click();
                await expect(
                    walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
                ).toHaveText(newLabel, { timeout: 30_000 });
            });
        });
    },
);
