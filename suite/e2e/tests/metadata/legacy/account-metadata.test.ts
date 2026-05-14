import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';
import { MetadataProvider } from '../../../support/mocks/metadataMock';

// Metadata is by default disabled, this means, that application does not try to generate master key and connect to cloud.
// Hovering over fields that may be labeled shows "add label" button upon which is clicked, Suite initiates metadata flow
test.describe('Account metadata', { tag: ['@webOnly', '@T3W1', '@T3T1', '@smoke'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ metadataMock }) => {
        await metadataMock.start(MetadataProvider.DROPBOX);
    });

    test('dropbox provider', async ({
        page,
        onboardingPage,
        dashboardPage,
        metadataPage,
        settingsPage,
        walletPage,
    }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await metadataPage.enableLegacyLabeling(MetadataProvider.DROPBOX);

        await test.step('Open account and initialize metadata flow', async () => {
            await walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }).click();
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('Bitcoin #1');

            // wait until account page is fully loaded
            await expect(walletPage.fiatAmount).toBeVisible();
            await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
        });

        await test.step('Edit label with Enter submit', async () => {
            await metadataPage.account.metadataInput.fill('cool new label');
            await page.keyboard.press('Enter');
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('cool new label');
            await metadataPage.account.successIconIsVisible(AccountLabelId.BitcoinDefault1);
        });

        await test.step('Edit label with button submit', async () => {
            await metadataPage.account.changeLabel({
                accountId: AccountLabelId.BitcoinDefault1,
                label: 'even cooler',
            });
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('even cooler');
        });

        await test.step('Discard label changes via Escape', async () => {
            await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.account.metadataInput.fill('bcash is true bitcoin');
            await page.keyboard.press('Escape');
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('even cooler');
        });

        await test.step('Search accounts by metadata label', async () => {
            const searchInput = walletPage.accountSearch.first();
            await searchInput.click();
            await searchInput.fill('even cooler');
            await expect(
                walletPage.accountButton({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toBeVisible();
            await searchInput.fill('non matching query');
            await expect(
                walletPage.accountButton({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toBeHidden();
            await searchInput.clear();
        });

        await test.step('Remove metadata by clearing input', async () => {
            await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.account.metadataInput.clear();
            await page.keyboard.press('Enter');
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('Bitcoin #1');
        });

        await test.step('Navigate to dashboard', async () => {
            await dashboardPage.dashboardMenuButton.click();
            await expect(dashboardPage.graph).toBeVisible();
        });

        await test.step('Add and label a new account', async () => {
            // Account number can change so we determine it dynamically
            const btcAccountCount = await page
                .locator('[data-testid^="@account-menu/btc/normal/"][data-testid$="/label"]')
                .count();
            const newAccountIndex = btcAccountCount;
            const newAccountLabelId = `m/84'/0'/${newAccountIndex}'` as AccountLabelId;
            await walletPage.openAccount();
            await walletPage.addAccountButton.click();
            await settingsPage.coinsTab.networkButton('btc').click();
            await page.getByTestId('@add-account').click();
            await metadataPage.account.changeLabel({
                accountId: newAccountLabelId,
                label: 'adding label to a newly added account. does it work?',
            });
            await expect(
                walletPage.accountLabel({
                    symbol: 'btc',
                    type: 'normal',
                    atIndex: newAccountIndex,
                }),
            ).toHaveText('adding label to a newly added account. does it work?');
        });
    });
});
