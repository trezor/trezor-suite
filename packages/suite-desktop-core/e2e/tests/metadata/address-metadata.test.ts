import { test, expect } from '../../support/fixtures';
import { MetadataProvider } from '../../support/metadataProviderMocks';

const metadataEl = '@metadata/addressLabel/bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m';

test.describe('Metadata - address labeling', { tag: ['@group=metadata', '@webOnly'] }, () => {
    test.use({
        emulatorStartConf: { wipe: true },
        emulatorSetupConf: { mnemonic: 'mnemonic_all' },
    });

    test.beforeEach(async ({ metadataProviderMocks }) => {
        await metadataProviderMocks.initializeProviderMocking(MetadataProvider.GOOGLE);
    });
    test('google provider', async ({ page, onboardingPage, metadataPage, dashboardPage }) => {
        // Pass through onboarding and device authentication
        await onboardingPage.completeOnboarding();

        // Finish discovery process
        // Discovery process completed
        await dashboardPage.discoveryShouldFinish();
        await expect(page.getByTestId('@account-menu/btc/normal/0')).toBeVisible();

        // Interact with accounts and metadata
        await page.getByTestId('@account-menu/btc/normal/0').click();
        await page.getByTestId('@wallet/menu/wallet-receive').click();
        await page.getByTestId('@wallet/receive/used-address/show-more').click();
        await page.getByTestId(`${metadataEl}/add-label-button`).click();

        // Initialize metadata flow
        // Metadata provider: google
        metadataPage.passThroughInitMetadata(MetadataProvider.GOOGLE);

        await metadataPage.metadataInput.fill('meow address');
        await page.keyboard.press('Enter');
        await expect(page.getByTestId(metadataEl)).toHaveText('meow address');

        // Edit metadata label
        await page.getByTestId(metadataEl).hover();
        await page.getByTestId(`${metadataEl}/edit-label-button`).click();
        await metadataPage.metadataInput.fill('meow meow');
        await page.keyboard.press('Enter');
        await expect(page.getByTestId(metadataEl)).toHaveText('meow meow');
    });

    test.afterEach(({ metadataProviderMocks }) => {
        metadataProviderMocks.stopProviderMocking();
    });
});
