import { expect, test } from '../../../support/fixtures';
import { MetadataProvider } from '../../../support/mocks/metadataMock';

const metadataAddress = 'bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m';

test.describe('Metadata - address labeling', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ metadataMock, onboardingPage, metadataPage, settingsPage }) => {
        await metadataMock.start(MetadataProvider.GOOGLE);
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await metadataPage.enableLegacyLabeling(MetadataProvider.GOOGLE);
    });

    test('google provider', async ({ page, metadataPage, walletPage }) => {
        await test.step('Interact with accounts and metadata', async () => {
            await walletPage.openAccount();
            await walletPage.receiveButton.click();
            await walletPage.showMoreButton.click();
            await metadataPage.address.clickEditLabel(metadataAddress);
        });

        await test.step('Add address label', async () => {
            await metadataPage.address.fillLabelInput('meow address');
            await page.keyboard.press('Enter');
            await metadataPage.address.successIconIsVisible(metadataAddress);
            await expect(metadataPage.address.label(metadataAddress)).toHaveText('meow address');
        });

        await test.step('Edit metadata label', async () => {
            await metadataPage.address.clickEditLabel(metadataAddress);
            await metadataPage.address.fillLabelInput('meow meow');
            await page.keyboard.press('Enter');
            await metadataPage.address.successIconIsVisible(metadataAddress);
            await expect(metadataPage.address.label(metadataAddress)).toHaveText('meow meow');
        });
    });
});
