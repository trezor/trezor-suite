import { OwnerId } from '@evolu/common';

import { asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { asAccountDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';

import {
    ownerId as defaultWalletOwnerId,
    ownerSecret as defaultWalletOwnerSecret,
    walletDescriptor,
} from '../../../fixtures/metadata/default-metadata-ids';
import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';

const defaultWalletIndex = 0;

const walletOne = {
    index: 1,
    passphrase: 'First passphrase',
    ownerId: OwnerId.orThrow('nv3sJB3YFuddnYPsMy03BA'),
    ownerSecret: asSuiteSyncOwnerSecretHex(
        'a42c516df49ec13ef4df8d2edfd33a893ddb3c5bb5423fb55e5f33a1852e2bc2d2fc70db8b35db609c730763f81c2d2bb491abf4f07505b0449386d54285b267',
    ),
};

const walletTwo = {
    index: 2,
    passphrase: 'Second passphrase',
    ownerId: OwnerId.orThrow('Mvz4DxvvznAgmppCU67NPw'),
    ownerSecret: asSuiteSyncOwnerSecretHex(
        '2b1643b805e3dec4ec2c3f57e707bce641f197ddd468070ffd4225393c4cb1a8e3935be81dd63f1e6d55145a73415d330328ba9c6eaa65fa56be8234fe512690',
    ),
};

const expectedDefaultWalletLabel = {
    updatedAt: null,
    isDeleted: null,
    ownerId: defaultWalletOwnerId,
    walletDescriptor,
    label: 'Evolu Default wallet',
};

const expectedWalletOneLabel = {
    updatedAt: null,
    isDeleted: null,
    ownerId: walletOne.ownerId,
    walletDescriptor: asWalletDescriptor('mokyaSGybeX7XrG5VWGoMtQepBXXK1RNW9'),
    label: 'Evolu wallet #1',
};

const expectedAccountLabelWalletOne = {
    updatedAt: null,
    isDeleted: null,
    ownerId: walletOne.ownerId,
    accountDescriptor: asAccountDescriptor(
        'zpub6r4imip23CwVmWTfqudEXK2PKZaw2bn8PEC1tju3d4oxQMfLK1QME9aN2o8t7potfCfz6f8T4jNafTyBVfEnqfXVUT8y4PWZ1JSc2HR8pRB',
    ),
    networkSymbol: 'btc',
    label: 'Evolu BTC acc Wallet #1',
};

const expectedWalletTwoLabel = {
    updatedAt: null,
    isDeleted: null,
    ownerId: walletTwo.ownerId,
    walletDescriptor: asWalletDescriptor('n4YWykLsjHxToK8LwXJ7e8gwabBbAUDTk2'),
    label: 'Evolu wallet #2',
};

test.describe('Suite Sync - Passphrase wallets', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({ wipeEvoluRelay: true, deviceSetup: { passphrase_protection: true } });

    test.beforeEach(async ({ onboardingPage, metadataPage }) => {
        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
        await metadataPage.setupQuotaManager();
        await metadataPage.enableSuiteSync();
    });

    test('Labels on multiple wallets', async ({
        page,
        evoluClient,
        dashboardPage,
        metadataPage,
        walletPage,
    }) => {
        await test.step('Change default wallet label', async () => {
            await dashboardPage.openDeviceSwitcher();
            await metadataPage.wallet.changeLabel({
                index: 0,
                label: expectedDefaultWalletLabel.label,
            });
        });

        await test.step('Add passphrase #1 and enable Suite sync', async () => {
            await dashboardPage.addUnusedHiddenWallet(walletOne.passphrase, {
                suiteSync: 'enable',
            });
            await expect(metadataPage.suiteSyncBanner).toBeHidden();
        });

        await test.step('Set label for passphrase wallet #1', async () => {
            await dashboardPage.openDeviceSwitcher();
            await page.waitForTimeout(500); // wait for the walletSwitcher to completely open
            await metadataPage.wallet.changeLabel({
                index: walletOne.index,
                label: expectedWalletOneLabel.label,
            });
        });

        await test.step('Add passphrase #2 and decline Suite sync', async () => {
            await dashboardPage.addUnusedHiddenWallet(walletTwo.passphrase, {
                suiteSync: 'decline',
            });
            await expect(metadataPage.suiteSyncBanner).toContainTranslation(
                'TR_SUITE_SYNC_KEYS_NEEDED_BANNER',
            );
        });

        await test.step('Set account label for passphrase wallet #1', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.openDevice(walletOne.index);
            await expect(metadataPage.suiteSyncBanner).toBeHidden();
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await metadataPage.account.changeLabel({
                accountId: AccountLabelId.BitcoinDefault1,
                label: expectedAccountLabelWalletOne.label,
            });
        });

        await test.step('Enable Suite sync on passphrase wallet #2 thru banner', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.openDevice(walletTwo.index);
            await metadataPage.suiteSyncBannerButton.click();
            await metadataPage.confirmSuiteSyncSetup();
            await expect(metadataPage.suiteSyncBanner).toBeHidden();
        });

        await test.step('Set label for passphrase wallet #2', async () => {
            await dashboardPage.openDeviceSwitcher();
            await page.waitForTimeout(500); // wait for the walletSwitcher to completely open
            await metadataPage.wallet.changeLabel({
                index: walletTwo.index,
                label: expectedWalletTwoLabel.label,
            });
        });

        await test.step('Verify wallet labels with closed wallet switcher', async () => {
            await dashboardPage.deviceSwitchingCloseButton.click();
            await expect(page.getByTestId('@deviceStatus-connected')).toHaveText(
                expectedWalletTwoLabel.label,
            );
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.openDevice(walletOne.index);
            await expect(page.getByTestId('@deviceStatus-connected')).toHaveText(
                expectedWalletOneLabel.label,
            );
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.openDevice(defaultWalletIndex);
            await expect(page.getByTestId('@deviceStatus-connected')).toHaveText(
                expectedDefaultWalletLabel.label,
            );
        });

        await test.step('Verify data are synced to Relay', async () => {
            // Default wallet data
            evoluClient.init({ ownerSecret: defaultWalletOwnerSecret });
            await evoluClient.expectInTable('wallet', [expectedDefaultWalletLabel], {
                softExpect: true,
            });
            // Passphrase #1 data
            evoluClient.init({ ownerSecret: walletOne.ownerSecret });
            await evoluClient.expectInTable('wallet', [expectedWalletOneLabel], {
                softExpect: true,
            });
            await evoluClient.expectInTable('account', [expectedAccountLabelWalletOne], {
                softExpect: true,
            });
            // Passphrase #2 data
            evoluClient.init({ ownerSecret: walletTwo.ownerSecret });
            await evoluClient.expectInTable('wallet', [expectedWalletTwoLabel], {
                softExpect: true,
            });
        });
    });
});
