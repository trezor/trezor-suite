import { expect, test } from '../../../support/fixtures';
import { MetadataProvider } from '../../../support/mocks/metadataMock';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Google API errors', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: { mnemonic: 'mnemonic_all' },
    });

    test.beforeEach(async ({ metadataMock }) => {
        await metadataMock.start(MetadataProvider.GOOGLE);
    });
    test(
        'Malformed token',
        {
            annotation: createTestAnnotation({
                testCase: 'Suite labeling handles malformed token from Google',
            }),
        },
        async ({ page, onboardingPage, settingsPage, metadataPage, metadataMock }) => {
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

            await settingsPage.navigateTo('application');

            await page.selectDropdownOptionWithRetry(
                settingsPage.metadataSelectInput,
                settingsPage.metadataSelectInputOption('legacy'),
            );

            await metadataPage.passThroughInitMetadata(MetadataProvider.GOOGLE, {
                skipVerification: true,
            });

            // Validate the error message in the toast notification
            await expect(page.getByTestId('@toast/error')).toHaveText(
                'Error: Failed to connect to labeling provider: Invalid Credentials',
            );
        },
    );

    // TODO: Add tests for more possible errors
    // Reference: https://developers.google.com/drive/api/v3/handle-errors
});
