import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';
import { MetadataProvider } from '../../../support/mocks/metadataMock';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe(
    'Metadata - switching between cloud providers',
    { tag: ['@webOnly', '@T3W1', '@T3T1'] },
    () => {
        const dropboxLabel = 'dropbox label';
        const googleLabel = 'google label';
        const defaultLabel = 'Bitcoin #1';

        test(
            'Start with one and switch to another',
            {
                annotation: createTestAnnotation({
                    testCase: 'Suite labeling support switching from provider to another',
                }),
            },
            async ({
                page,
                onboardingPage,
                metadataPage,
                settingsPage,
                metadataMock,
                walletPage,
            }) => {
                await test.step('Navigate to account and verify initial state', async () => {
                    await onboardingPage.completeOnboarding();
                    await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
                    await metadataMock.start(MetadataProvider.DROPBOX);
                    await metadataPage.enableLegacyLabeling(MetadataProvider.DROPBOX);
                    await walletPage.openAccount();
                    await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                        defaultLabel,
                    );
                });

                await test.step('Start Dropbox provider and add a label', async () => {
                    await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);

                    await metadataPage.account.metadataInput.fill(dropboxLabel);
                    await page.keyboard.press('Enter');
                    await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                        dropboxLabel,
                    );
                });

                await test.step('Disconnect Dropbox', async () => {
                    await settingsPage.navigateTo('application');
                    await page.getByTestId('@settings/metadata/disconnect-provider-button').click();
                    await expect(
                        page.getByTestId('@settings/metadata/connect-provider-button'),
                    ).toBeVisible();

                    await metadataMock.stop();
                });

                await test.step('Verify that labels are removed after disconnect', async () => {
                    await walletPage.openAccount();
                    await expect(
                        page.getByTestId('@account-menu/btc/normal/0/label'),
                    ).toBeVisible();
                    await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                        defaultLabel,
                    );
                });

                await test.step('Start Google provider and add a label', async () => {
                    await metadataMock.start(MetadataProvider.GOOGLE);

                    await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
                    await expect(page.getByTestId('@modal/metadata-provider')).toBeVisible();
                    await expect(
                        page.getByTestId('@modal/metadata-provider/file-system-button'),
                    ).toBeHidden();
                    await page.getByTestId('@modal/metadata-provider/google-button').click();
                    await expect(page.getByTestId('@modal/metadata-provider')).toBeHidden();

                    await metadataPage.account.metadataInput.fill(googleLabel);
                    await page.keyboard.press('Enter');
                    await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                        googleLabel,
                    );
                });
            },
        );
    },
);
