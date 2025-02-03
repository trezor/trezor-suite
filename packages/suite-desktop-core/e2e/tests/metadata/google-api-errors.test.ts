import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataProviderMock';

test.describe('Google API errors', { tag: ['@group=metadata1', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_all' },
    });

    test.beforeEach(async ({ metadataProviderMock }) => {
        await metadataProviderMock.start(MetadataProvider.GOOGLE);
    });
    test('Malformed token', async ({
        page,
        onboardingPage,
        dashboardPage,
        metadataPage,
        metadataProviderMock,
    }) => {
        // Simulate API responses for retries with malformed token
        for (let i = 0; i < 4; i++) {
            metadataProviderMock.setNextResponse({
                status: 401,
                body: {
                    error: {
                        errors: [
                            {
                                domain: 'global',
                                reason: 'authError',
                                message: 'Invalid Credentials',
                                locationType: 'header',
                                location: 'Authorization',
                            },
                        ],
                        code: 401,
                        message: 'Invalid Credentials',
                    },
                },
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
            });
        }

        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();

        await page.getByTestId('@account-menu/btc/normal/0').click();
        await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);

        await metadataPage.passThroughInitMetadata(MetadataProvider.GOOGLE, {
            skipVerification: true,
        });

        // Validate the error message in the toast notification
        await expect(page.getByTestId('@toast/error')).toHaveText(
            'Error: Failed to connect to labeling provider: Invalid Credentials',
        );
    });

    test.afterEach(async ({ metadataProviderMock }) => {
        await metadataProviderMock.stop();
    });

    // TODO: Add tests for more possible errors
    // Reference: https://developers.google.com/drive/api/v3/handle-errors
});
