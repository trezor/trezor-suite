import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';

const metadataEl = '@metadata/addressLabel/bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m';

test.describe('Metadata - address labeling', { tag: ['@group=metadata1', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ metadataMock }) => {
        await metadataMock.start(MetadataProvider.GOOGLE);
    });

    test('google provider', async ({
        page,
        onboardingPage,
        metadataPage,
        dashboardPage,
        walletPage,
    }) => {
        // Pass through onboarding and device authentication
        await onboardingPage.completeOnboarding();

        // Finish discovery process
        // Discovery process completed
        await dashboardPage.discoveryShouldFinish();
        await expect(page.getByTestId('@account-menu/btc/normal/0')).toBeVisible();

        // Interact with accounts and metadata
        await walletPage.openAccount();
        await page.getByTestId('@wallet/menu/wallet-receive').click();
        await page.getByTestId('@wallet/receive/used-address/show-more').click();
        await page.getByTestId(`${metadataEl}/add-label-button`).click();

        // Initialize metadata flow
        // Metadata provider: google
        metadataPage.passThroughInitMetadata(MetadataProvider.GOOGLE);

        await metadataPage.address.metadataInput.fill('meow address');
        await page.keyboard.press('Enter');
        await expect(page.getByTestId(metadataEl)).toHaveText('meow address');

        // Edit metadata label
        await page.getByTestId(metadataEl).hover();
        await page.getByTestId(`${metadataEl}/edit-label-button`).click();
        await metadataPage.address.metadataInput.fill('meow meow');
        await page.keyboard.press('Enter');
        await expect(page.getByTestId(metadataEl)).toHaveText('meow meow');
    });
});
