import { messages } from '@suite/intl';
import { mnemonic12Fixtures } from '@suite-common/e2e-evolu-client';
import {
    DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA,
    DEFAULT_DEVICE_SIZE_QUOTA,
} from '@suite-common/suite-sync-quota-manager';

import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';

const { buildExpectedAccount, buildExpectedWallet, ownerId, ownerSecret } = mnemonic12Fixtures;

const expectedAccount = buildExpectedAccount({ label: 'Evolu quota BTC account' });
const expectedWallet = buildExpectedWallet({ label: 'Evolu quota wallet' });

const defaultWalletIndex = 0;
const hiddenWalletIndex = 1;
const hiddenWalletPassphrase = 'First passphrase';
const hiddenWalletLabel = 'Evolu local-only wallet';

// Below the bytes already stored for the owner, so the next relay write is rejected
const shrunkenOwnerStorageLimit = 10;

test.describe('Suite Sync - Quota Manager out of quota', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.slow();
    test.use({
        wipeEvoluRelay: true,
        deviceSetup: { passphrase_protection: true },
        ignoreToastErrors: [messages.TR_SUITE_SYNC_ERROR_DEVICE_CANCELLED.defaultMessage],
    });

    test.beforeEach(async ({ onboardingPage, metadataPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.toggleDebugModeInSettings();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await metadataPage.enableSuiteSync();
    });

    test('Drained device pool shows banner and blocks syncing of a new wallet', async ({
        page,
        evoluClient,
        dashboardPage,
        metadataPage,
    }) => {
        await test.step('Change default wallet label to allocate its quota', async () => {
            await dashboardPage.openDeviceSwitcher();
            await metadataPage.wallet.changeLabel({
                index: defaultWalletIndex,
                label: expectedWallet.label,
                confirmSuiteSync: true,
            });
        });

        await test.step('Drain the device quota pool', () => {
            evoluClient.setDeviceUnspentStorageSize({ unspentStorageSize: 0 });
        });

        await test.step('Add passphrase wallet and enable Suite Sync', async () => {
            await dashboardPage.addUnusedHiddenWallet(hiddenWalletPassphrase, {
                suiteSync: 'enable',
            });
        });

        await test.step('Out-of-quota banner is shown on Dashboard', async () => {
            await expect(metadataPage.outOfQuotaBanner).toContainTranslation(
                'TR_SUITE_SYNC_OUT_OF_QUOTA_BANNER_DESCRIPTION',
            );
        });

        await test.step('Label written on the new wallet is kept locally', async () => {
            await dashboardPage.openDeviceSwitcher();
            await page.waitForTimeout(500); // wait for the walletSwitcher to completely open
            await metadataPage.wallet.changeLabel({
                index: hiddenWalletIndex,
                label: hiddenWalletLabel,
                confirmSuiteSync: true,
            });
            await expect(metadataPage.wallet.walletLabel(hiddenWalletIndex)).toHaveText(
                hiddenWalletLabel,
            );
            await dashboardPage.deviceSwitchingCloseButton.click();
        });

        await test.step('No storage was allocated for the new wallet on the server', () => {
            const { devices, owners } = evoluClient.readQuotaManagerData();
            // Only the default wallet allocation exists, nothing for the new wallet
            expect(owners).toEqual([
                { ownerId, storageLimit: DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA },
            ]);
            expect(devices).toEqual([expect.objectContaining({ unspentStorageSize: 0 })]);
        });

        await test.step('Banner disappears after dismissal', async () => {
            await metadataPage.outOfQuotaBannerDismissButton.click();
            await expect(metadataPage.outOfQuotaBanner).toBeHidden();
        });
    });
});

test.describe('Suite Sync - Quota Manager top-up', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ wipeEvoluRelay: true });

    test.beforeEach(async ({ onboardingPage, metadataPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.toggleDebugModeInSettings();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await metadataPage.enableSuiteSync();
    });

    test('Exceeded wallet limit is topped up from the device pool', async ({
        evoluClient,
        dashboardPage,
        devicePrompt,
        metadataPage,
        walletPage,
    }) => {
        await test.step('Create account label to trigger the first allocation', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await metadataPage.account.changeLabel({
                accountId: AccountLabelId.BitcoinDefault1,
                label: expectedAccount.label,
                confirmSuiteSync: true,
            });
        });

        await test.step('Label is synced and one increment is allocated', async () => {
            await evoluClient.init({ ownerSecret });
            await evoluClient.expectInTable('account', [expectedAccount], { timeout: 30_000 });

            const { devices, owners } = evoluClient.readQuotaManagerData();
            expect(owners).toEqual([
                { ownerId, storageLimit: DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA },
            ]);
            expect(devices).toEqual([
                expect.objectContaining({
                    totalStorageSize: DEFAULT_DEVICE_SIZE_QUOTA,
                    unspentStorageSize:
                        DEFAULT_DEVICE_SIZE_QUOTA - DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA,
                }),
            ]);
        });

        await test.step('Shrink the wallet storage limit below current usage', () => {
            evoluClient.setOwnerStorageLimit({
                ownerId,
                storageLimit: shrunkenOwnerStorageLimit,
            });
        });

        await test.step('Write another label to exceed the wallet limit', async () => {
            await dashboardPage.openDeviceSwitcher();
            await metadataPage.wallet.changeLabel({
                index: defaultWalletIndex,
                label: expectedWallet.label,
            });
            // The rejected relay write triggers a quota top-up, which needs
            // device keys again (they cannot be stored in the e2e environment)
            await devicePrompt.confirmSuiteSyncSetup();
            await dashboardPage.deviceSwitchingCloseButton.click();
        });

        await test.step('Wallet limit is topped up from the device pool', async () => {
            await expect
                .poll(() => evoluClient.readQuotaManagerData().owners, { timeout: 30_000 })
                .toEqual([
                    {
                        ownerId,
                        storageLimit:
                            shrunkenOwnerStorageLimit + DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA,
                    },
                ]);

            const { devices } = evoluClient.readQuotaManagerData();
            expect(devices).toEqual([
                expect.objectContaining({
                    unspentStorageSize:
                        DEFAULT_DEVICE_SIZE_QUOTA - 2 * DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA,
                }),
            ]);
        });

        await test.step('Rejected label is synced to the relay after the top-up', async () => {
            await evoluClient.expectInTable('wallet', [expectedWallet], { timeout: 30_000 });
            await evoluClient.expectInTable('account', [expectedAccount], { timeout: 30_000 });
        });
    });
});
