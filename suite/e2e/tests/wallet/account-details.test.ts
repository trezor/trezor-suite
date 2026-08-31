import type { TranslationKey } from '@suite/intl';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const evmDetailsCases: {
    symbol: NetworkSymbol;
    type: 'normal' | 'ledger' | 'legacy';
    accountTypeKey: TranslationKey;
    path: string;
}[] = [
    {
        symbol: 'eth',
        type: 'normal',
        accountTypeKey: 'TR_ACCOUNT_TYPE_DEFAULT',
        path: "m/44'/60'/0'/0/0",
    },
    {
        symbol: 'bsc',
        type: 'normal',
        accountTypeKey: 'TR_ACCOUNT_TYPE_DEFAULT',
        path: "m/44'/60'/0'/0/0",
    },
    {
        symbol: 'base',
        type: 'normal',
        accountTypeKey: 'TR_ACCOUNT_TYPE_DEFAULT',
        path: "m/44'/60'/0'/0/0",
    },
    {
        symbol: 'arb',
        type: 'normal',
        accountTypeKey: 'TR_ACCOUNT_TYPE_DEFAULT',
        path: "m/44'/60'/0'/0/0",
    },
    {
        symbol: 'eth',
        type: 'ledger',
        accountTypeKey: 'TR_ACCOUNT_TYPE_LEDGER',
        path: "m/44'/60'/1'/0/0",
    },
    {
        symbol: 'bsc',
        type: 'ledger',
        accountTypeKey: 'TR_ACCOUNT_TYPE_LEDGER',
        path: "m/44'/60'/1'/0/0",
    },
    {
        symbol: 'eth',
        type: 'legacy',
        accountTypeKey: 'TR_ACCOUNT_TYPE_LEGACY',
        path: "m/44'/60'/0'/0",
    },
];

test.describe('Account details', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage, walletPage, page }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.toggleDebugModeInSettings();
        await settingsPage.changeNetworks({ enableNetworks: ['eth', 'bsc', 'base', 'arb'] });
        await dashboardPage.navigateTo();
        await walletPage.addAccount({ symbol: 'eth', type: 'ledger' });
        await walletPage.addAccount({ symbol: 'bsc', type: 'ledger' });
        await walletPage.addAccount({ symbol: 'eth', type: 'legacy' });
        await page.discoveryShouldFinish();
    });

    test(
        'User can see EVM account type, derivation path and nonce on the Details tab',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that EVM account details show account type, derivation path, no xpub, and a numeric nonce.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite', 'EVM account'],
                steps: [
                    'Navigate to an EVM account and open the "Details" tab',
                    'Confirm no "Show xpub" is displayed for the EVM account',
                    'Confirm the account type and derivation path match the account',
                    'Confirm the account nonce is displayed as a number',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async ({ walletPage }) => {
            for (const { symbol, type, accountTypeKey, path } of evmDetailsCases) {
                await test.step(`${symbol} ${type} details`, async () => {
                    await walletPage.openAccount({ symbol, type, atIndex: 0 });
                    await walletPage.accountDetailsTabButton.click();
                    await expect(walletPage.accountDetails).toBeVisible();
                    await expect(walletPage.showPublicKeyButton).toBeHidden();
                    await expect(walletPage.accountType).toHaveTranslation(accountTypeKey);
                    await expect(walletPage.accountTypeTech).toContainTranslation(
                        'TR_ACCOUNT_TYPE_BIP44_TECH',
                    );
                    await expect(walletPage.derivationPath).toHaveText(path);
                    await expect(walletPage.accountNonce).toBeVisible();
                    await expect(walletPage.accountNonce).toContainTranslation(
                        'TR_ACCOUNT_DETAILS_NONCE_CONFIRMED',
                    );
                    await expect(walletPage.accountNonceValue).toHaveTextGreaterThan(-1);
                });
            }
        },
    );
});
