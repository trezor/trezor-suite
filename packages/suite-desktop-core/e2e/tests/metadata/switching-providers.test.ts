import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataProviderMock';

test.describe(
    'Metadata - switching between cloud providers',
    { tag: ['@group=metadata', '@webOnly'] },
    () => {
        const dropboxLabel = 'dropbox label';
        const googleLabel = 'google label';
        const defaultLabel = 'Bitcoin #1';

        test('Start with one and switch to another', async ({
            page,
            onboardingPage,
            dashboardPage,
            metadataPage,
            settingsPage,
            metadataProviderMock,
        }) => {
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();

            // Navigate to account and verify initial state
            await page.getByTestId('@account-menu/btc/normal/0').click();
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                defaultLabel,
            );

            await metadataProviderMock.start(MetadataProvider.DROPBOX);

            // Add a label using Dropbox
            await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);

            await metadataPage.account.metadataInput.fill(dropboxLabel);
            await page.keyboard.press('Enter');
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                dropboxLabel,
            );

            // Disconnect Dropbox
            await settingsPage.navigateTo('application');
            await page.getByTestId('@settings/metadata/disconnect-provider-button').click();
            await expect(
                page.getByTestId('@settings/metadata/connect-provider-button'),
            ).toBeVisible();

            await metadataProviderMock.stop();

            // Verify that labels are removed after disconnect
            await page.getByTestId('@account-menu/btc/normal/0').click();
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toBeVisible();
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                defaultLabel,
            );

            await metadataProviderMock.start(MetadataProvider.GOOGLE);

            // Connect to Google and add a label
            await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
            await expect(page.getByTestId('@modal/metadata-provider')).toBeVisible();
            await expect(
                page.getByTestId('@modal/metadata-provider/file-system-button'),
            ).not.toBeVisible();
            await page.getByTestId('@modal/metadata-provider/google-button').click();
            await expect(page.getByTestId('@modal/metadata-provider')).not.toBeVisible();

            await metadataPage.account.metadataInput.fill(googleLabel);
            await page.keyboard.press('Enter');
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                googleLabel,
            );
        });

        test.afterEach(async ({ metadataProviderMock }) => {
            await metadataProviderMock.stop();
        });
    },
);
