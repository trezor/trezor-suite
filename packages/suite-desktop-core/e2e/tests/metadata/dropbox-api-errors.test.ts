import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';

test.describe('Dropbox API errors', { tag: ['@group=metadata', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_all' },
    });

    test.beforeEach(async ({ metadataMock }) => {
        await metadataMock.start(MetadataProvider.DROPBOX);
    });
    test('Malformed token', async ({
        page,
        onboardingPage,
        settingsPage,
        metadataPage,
        walletPage,
        metadataMock,
    }) => {
        await metadataMock.setFileContent(
            '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
            metadataMock.defaultFileContent,
            metadataMock.defaultAesKey,
        );

        await onboardingPage.completeOnboarding();

        await settingsPage.navigateTo('application');
        await settingsPage.metadataSwitch.click();

        await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);

        await walletPage.openAccount();

        await metadataPage.account.accountLabel(AccountLabelId.BitcoinDefault1).click();
        await metadataPage.account.editLabelButton(AccountLabelId.BitcoinDefault1).click();

        // Simulated API responses for retries with malformed token must be supplied exactly at this point in the flow
        for (let i = 0; i < 4; i++) {
            metadataMock.setNextResponse({
                status: 400,
                body: 'Error in call to API function "files/upload": The given OAuth 2 access token is malformed.',
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                },
            });
        }

        await metadataPage.account.metadataInput.fill('Kvooo');
        await page.keyboard.press('Enter');

        // Validate the error message in the toast notification
        await expect(page.getByTestId('@toast/error')).toHaveText(
            'Error: Failed to save labeling data: Error in call to API function "files/upload": The given OAuth 2 access token is malformed.',
        );

        await expect(
            metadataPage.account.accountLabel(AccountLabelId.BitcoinDefault1),
        ).toContainText('Bitcoin #1');
    });

    //TODO: #17855 Fix unstable test
    test.skip('Success after retrying GET request', async ({
        onboardingPage,
        settingsPage,
        metadataPage,
        walletPage,
        metadataMock,
    }) => {
        await metadataMock.setFileContent(
            '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
            metadataMock.defaultFileContent,
            metadataMock.defaultAesKey,
        );

        await onboardingPage.completeOnboarding();

        await settingsPage.navigateTo('application');
        await settingsPage.metadataSwitch.click();

        await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);

        metadataMock.setNextResponse({
            status: 200,
            body: {
                name: {
                    given_name: 'dog',
                    surname: 'cat',
                    familiar_name: 'kitty-dog',
                    display_name: 'dog-cat',
                    abbreviated_name: 'DC',
                },
                email: 'some@mail.com',
                email_verified: true,
                profile_photo_url: 'foo',
                disabled: false,
                country: 'CZ',
                locale: 'en',
                referral_link: 'foo',
                is_paired: false,
            },
        });

        metadataMock.setNextResponse({
            status: 429,
            body: 'Rate limited!',
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

        await walletPage.openAccount();
        await metadataPage.account.editLabel(AccountLabelId.BitcoinDefault1, 'Kvooo');
        await expect(
            metadataPage.account.accountLabel(AccountLabelId.BitcoinDefault1),
        ).toContainText('Kvooo');
    });

    test('Incomplete data returned from provider', async ({
        onboardingPage,
        settingsPage,
        metadataPage,
        walletPage,
        metadataMock,
    }) => {
        await metadataMock.setFileContent(
            '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
            {
                version: '1.0.0',
                accountLabel: 'already existing label',
                // note: outputLabels and addressLabels are missing. this can happen in 2 situations:
                // 1] user manually changed the files (very unlikely);
                // 2] we screwed app data saving or reading
            },
            metadataMock.defaultAesKey,
        );

        await onboardingPage.completeOnboarding();

        await settingsPage.navigateTo('application');
        await settingsPage.metadataSwitch.click();

        await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);

        await walletPage.openAccount();
        // just enter some label, this indicates that app did not crash
        await metadataPage.account.editLabel(AccountLabelId.BitcoinDefault1, 'Kvooo');
    });

    // TODO: Add tests for more possible errors
});
