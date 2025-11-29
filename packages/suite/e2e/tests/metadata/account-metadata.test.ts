import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';

// Metadata is by default disabled, this means, that application does not try to generate master key and connect to cloud.
// Hovering over fields that may be labeled shows "add label" button upon which is clicked, Suite initiates metadata flow
test.describe('Account metadata', { tag: ['@group=metadata', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
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

        await test.step('Open account and initialize metadata flow', async () => {
            await walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }).click();
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('Bitcoin #1');

            await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);
        });

        await test.step('Edit label with Enter submit', async () => {
            await metadataPage.account.metadataInput.fill('cool new label');
            await page.keyboard.press('Enter');
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('cool new label');
        });

        await test.step('Edit label with button submit', async () => {
            await metadataPage.account.editLabel(AccountLabelId.BitcoinDefault1, 'even cooler');
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('even cooler');

            await expect(
                metadataPage.account.successLabel(AccountLabelId.BitcoinDefault1),
            ).toBeVisible();
            await expect(
                metadataPage.account.successLabel(AccountLabelId.BitcoinDefault1),
            ).toBeHidden();
        });

        await test.step('Discard label changes via Escape', async () => {
            await metadataPage.account.accountLabel(AccountLabelId.BitcoinDefault1).click();
            await metadataPage.account.editLabelButton(AccountLabelId.BitcoinDefault1).click();
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
            await metadataPage.account.accountLabel(AccountLabelId.BitcoinDefault1).hover();
            await metadataPage.account.editLabelButton(AccountLabelId.BitcoinDefault1).click();
            await metadataPage.account.metadataInput.clear();
            await page.keyboard.press('Enter');
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('Bitcoin #1');
        });

        await test.step('Switch between segwit accounts and check success indicators', async () => {
            await walletPage.segwitGroupButton.click();
            await walletPage.openAccount({ symbol: 'btc', type: 'segwit', atIndex: 0 });

            await metadataPage.account.addLabel(
                AccountLabelId.BitcoinSegwit1,
                'typing into one input',
            );
            await expect(
                metadataPage.account.successLabel(AccountLabelId.BitcoinSegwit1),
            ).toBeVisible();

            await walletPage.openAccount({ symbol: 'btc', type: 'segwit', atIndex: 1 });
            await expect(
                metadataPage.account.successLabel(AccountLabelId.BitcoinSegwit2),
            ).toBeHidden();
            await expect(
                metadataPage.account.successLabel(AccountLabelId.BitcoinSegwit1),
            ).toBeHidden();
        });

        await test.step('Navigate to dashboard', async () => {
            await dashboardPage.dashboardMenuButton.click();
            await expect(dashboardPage.graph).toBeVisible();
        });

        await test.step('Add and label a new account', async () => {
            await walletPage.openAccount();
            await walletPage.addAccountButton.click();
            await settingsPage.coins.networkButton('btc').click();
            await page.getByTestId('@add-account').click();
            await metadataPage.account.addLabel(
                AccountLabelId.BitcoinDefault3,
                'adding label to a newly added account. does it work?',
            );
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 2 }),
            ).toHaveText('adding label to a newly added account. does it work?');
        });
    });
});
