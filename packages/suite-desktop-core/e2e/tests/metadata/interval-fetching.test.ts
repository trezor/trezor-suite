import { METADATA_LABELING } from '@trezor/suite/src/actions/suite/constants';

import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataProviderMock';

const providers = [
    {
        provider: MetadataProvider.GOOGLE,
        file: 'f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
    },
    {
        provider: MetadataProvider.DROPBOX,
        file: '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
    },
] as const;

test.describe('Account metadata', { tag: ['@group=metadata1', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });

    providers.forEach(p => {
        test(`${p.provider} - watches files over time`, async ({
            page,
            onboardingPage,
            dashboardPage,
            metadataPage,
            metadataProviderMock,
        }) => {
            await page.clock.install();
            await metadataProviderMock.start(p.provider);
            await metadataProviderMock.setFileContent(
                p.file,
                metadataProviderMock.defaultFileContent,
                metadataProviderMock.defaultAesKey,
            );

            await onboardingPage.completeOnboarding({ enableViewOnly: true });

            await dashboardPage.discoveryShouldFinish();

            await page.getByTestId('@account-menu/btc/normal/0/label').click();
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                'Bitcoin #1',
            );
            await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.passThroughInitMetadata(p.provider);
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                'already existing label',
            );

            await metadataProviderMock.setFileContent(
                p.file,
                {
                    ...metadataProviderMock.defaultFileContent,
                    accountLabel: 'label from another window',
                },
                metadataProviderMock.defaultAesKey,
            );

            await page.clock.fastForward(METADATA_LABELING.FETCH_INTERVAL);
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                'label from another window',
            );
        });
    });

    test.afterEach(async ({ metadataProviderMock }) => {
        await metadataProviderMock.stop();
    });
});
