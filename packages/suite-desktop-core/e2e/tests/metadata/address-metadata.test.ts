import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';

const metadataAddress = 'bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m';

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

        // Interact with accounts and metadata
        await walletPage.openAccount();
        await walletPage.receiveButton.click();
        await walletPage.showMoreButton.click();
        await metadataPage.address.clickAddLabel(metadataAddress);

        // Initialize metadata flow
        // Metadata provider: google
        metadataPage.passThroughInitMetadata(MetadataProvider.GOOGLE);

        await metadataPage.address.metadataInput.fill('meow address');
        await page.keyboard.press('Enter');
        await expect(metadataPage.address.label(metadataAddress)).toHaveText('meow address');

        // Edit metadata label
        await metadataPage.address.clickEditLabel(metadataAddress);
        await metadataPage.address.metadataInput.fill('meow meow');
        await page.keyboard.press('Enter');
        await expect(metadataPage.address.label(metadataAddress)).toHaveText('meow meow');
    });
});
