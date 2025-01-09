import { test, expect } from '../../support/fixtures';
import { MetadataProvider } from '../../support/metadataProviderMocks';
import { AccountLabelId } from '../../support/enums/accountLabelId';

// Metadata is by default disabled, this means, that application does not try to generate master key and connect to cloud.
// Hovering over fields that may be labeled shows "add label" button upon which is clicked, Suite initiates metadata flow
test.describe('Account metadata', { tag: ['@group=metadata', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_all' },
    });

    test.beforeEach(async ({ metadataProviderMocks }) => {
        await metadataProviderMocks.initializeProviderMocking(MetadataProvider.DROPBOX);
    });
    test('dropbox provider', async ({
        page,
        onboardingPage,
        dashboardPage,
        metadataPage,
        settingsPage,
    }) => {
        await onboardingPage.completeOnboarding();

        // Finish discovery process
        // Discovery process completed
        await dashboardPage.discoveryShouldFinish();

        await expect(page.getByTestId('@account-menu/btc/normal/0')).toBeVisible();

        // Interact with accounts and metadata
        // Clicking "Bitcoin" label in account menu is not possible, click triggers metadata flow
        await page.getByTestId('@account-menu/btc/normal/0/label').click();
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText('Bitcoin #1');

        // Metadata flow
        await metadataPage.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
        await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);

        // Edit label
        await metadataPage.metadataInput.fill('cool new label');
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
            'cool new label',
        );

        // Submit label changes via button
        await metadataPage.editLabel(AccountLabelId.BitcoinDefault1, 'even cooler');
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
            'even cooler',
        );

        await expect(metadataPage.successLabel(AccountLabelId.BitcoinDefault1)).toBeVisible();
        await expect(metadataPage.successLabel(AccountLabelId.BitcoinDefault1)).not.toBeVisible();

        // Discard changes via escape
        await metadataPage.accountLabel(AccountLabelId.BitcoinDefault1).click();
        await metadataPage.editLabelButton(AccountLabelId.BitcoinDefault1).click();
        await metadataPage.metadataInput.fill('bcash is true bitcoin');
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
            'even cooler',
        );

        // Test account search with metadata
        const searchInput = page.getByTestId('@account-menu/search-input').first();
        await searchInput.click();
        await searchInput.fill('even cooler');
        await expect(page.getByTestId('@account-menu/btc/normal/0')).toBeVisible();
        await searchInput.fill('something retarded');
        await expect(page.getByTestId('@account-menu/btc/normal/0')).not.toBeVisible();
        await searchInput.clear();

        // Remove metadata by clearing input
        await metadataPage.hoverAccountLabel(AccountLabelId.BitcoinDefault1);
        await metadataPage.editLabelButton(AccountLabelId.BitcoinDefault1).click();
        await metadataPage.metadataInput.clear();
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText('Bitcoin #1');

        // Test switching between accounts
        await page.getByTestId('@account-menu/segwit').click();
        await page.getByTestId('@account-menu/btc/segwit/0').click();

        await metadataPage.addLabel(AccountLabelId.BitcoinSegwit1, 'typing into one input');
        await expect(metadataPage.successLabel(AccountLabelId.BitcoinSegwit1)).toBeVisible();

        await page.getByTestId('@account-menu/btc/segwit/1').click();

        await expect(metadataPage.successLabel(AccountLabelId.BitcoinSegwit2)).not.toBeVisible();
        await expect(metadataPage.successLabel(AccountLabelId.BitcoinSegwit1)).not.toBeVisible();

        // Check metadata requests when switching routes
        await page.getByTestId('@suite/menu/suite-index').click();
        await expect(dashboardPage.graph).toBeVisible();

        // Add and label a new account
        await page.getByTestId('@account-menu/btc/normal/0').click();
        await page.getByTestId('@account-menu/add-account').click();
        await settingsPage.coins.networkButton('btc').click();
        await page.getByTestId('@add-account').click();
        await metadataPage.addLabel(
            AccountLabelId.BitcoinDefault3,
            'adding label to a newly added account. does it work?',
        );
        await expect(page.getByTestId('@account-menu/btc/normal/2/label')).toHaveText(
            'adding label to a newly added account. does it work?',
        );
    });

    test.afterEach(({ metadataProviderMocks }) => {
        metadataProviderMocks.stopProviderMocking();
    });
});
