import { test, expect } from '../../support/fixtures';
import { MetadataProvider, MetadataProviderMock } from '../../support/metadataProviderMocks';

// Metadata is by default disabled, this means, that application does not try to generate master key and connect to cloud.
// Hovering over fields that may be labeled shows "add label" button upon which is clicked, Suite initiates metadata flow
test.describe('Account metadata', { tag: ['@group=metadata', '@webOnly'] }, () => {
    test.use({
        emulatorStartConf: { wipe: true },
        emulatorSetupConf: { mnemonic: 'mnemonic_all' },
    });

    let provider: MetadataProviderMock;
    test.beforeEach(async ({ metadataProviderMocks }) => {
        metadataProviderMocks.initializeProviderMocking();
        provider = metadataProviderMocks.getMetadataProvider(MetadataProvider.DROPBOX);
        await provider.start();
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
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText('Bitcoin');

        // Metadata flow
        await metadataPage.clickAddLabelButton("m/84'/0'/0'");
        await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);

        // Edit label
        await metadataPage.metadataInput.fill('cool new label');
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
            'cool new label',
        );

        // Submit label changes via button
        await metadataPage.editLabel("m/84'/0'/0'", 'even cooler');
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
            'even cooler',
        );

        await expect(metadataPage.successLabel("m/84'/0'/0'")).toBeVisible();
        await expect(metadataPage.successLabel("m/84'/0'/0'")).not.toBeVisible();

        // Discard changes via escape
        await metadataPage.accountLabel("m/84'/0'/0'").click();
        await metadataPage.editLabelButton("m/84'/0'/0'").click();
        await metadataPage.metadataInput.fill('bcash is true bitcoin');
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
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
        await metadataPage.hoverAccountLabel("m/84'/0'/0'");
        await metadataPage.editLabelButton("m/84'/0'/0'").click();
        await metadataPage.metadataInput.clear();
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText('Bitcoin');

        // Test switching between accounts
        await page.getByTestId('@account-menu/segwit').click();
        await page.getByTestId('@account-menu/btc/segwit/0').click();

        await metadataPage.addLabel("m/49'/0'/0'", 'typing into one input');
        await expect(metadataPage.successLabel("m/49'/0'/0'")).toBeVisible();

        await page.getByTestId('@account-menu/btc/segwit/1').click();

        await expect(metadataPage.successLabel("m/49'/0'/1'")).not.toBeVisible();
        await expect(metadataPage.successLabel("m/49'/0'/0'")).not.toBeVisible();

        // Check metadata requests when switching routes
        await page.getByTestId('@suite/menu/suite-index').click();
        await expect(dashboardPage.graph).toBeVisible();

        // Add and label a new account
        await page.getByTestId('@account-menu/btc/normal/0').click();
        await page.getByTestId('@account-menu/add-account').click();
        await settingsPage.coins.networkButton('btc').click();
        await page.getByTestId('@add-account').click();
        await metadataPage.addLabel(
            "m/84'/0'/2'",
            'adding label to a newly added account. does it work?',
        );
    });

    test.afterEach(() => {
        provider.stop();
    });
});
