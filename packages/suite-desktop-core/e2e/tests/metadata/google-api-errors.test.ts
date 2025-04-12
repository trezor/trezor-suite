import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';

test.describe('Google API errors', { tag: ['@group=metadata', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_all' },
    });

    test.beforeEach(async ({ metadataMock }) => {
        await metadataMock.start(MetadataProvider.GOOGLE);
    });
    test('Malformed token', async ({
        page,
        onboardingPage,
        metadataPage,
        walletPage,
        metadataMock,
    }) => {
        // Simulate API responses for retries with malformed token
        for (let i = 0; i < 4; i++) {
            metadataMock.setNextResponse({
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

        await walletPage.openAccount();
        await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);

        await metadataPage.passThroughInitMetadata(MetadataProvider.GOOGLE, {
            skipVerification: true,
        });

        // Validate the error message in the toast notification
        await expect(page.getByTestId('@toast/error')).toHaveText(
            'Error: Failed to connect to labeling provider: Invalid Credentials',
        );
    });

    // TODO: Add tests for more possible errors
    // Reference: https://developers.google.com/drive/api/v3/handle-errors
});
