// Hack: direct import to prevent some nasty import cascade resulting in error while importing icons
import * as METADATA_LABELING from '@suite/metadata/src/metadataLabelingConstants';

import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';
import { MetadataProvider } from '../../../support/mocks/metadataMock';

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

test.describe('Account metadata', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    providers.forEach(p => {
        test(`${p.provider} - watches files over time`, async ({
            page,
            onboardingPage,
            metadataPage,
            metadataMock,
        }) => {
            await page.clock.install();
            await metadataMock.start(p.provider);
            await metadataMock.setFileContent(
                p.file,
                metadataMock.defaultFileContent,
                metadataMock.defaultAesKey,
            );

            await onboardingPage.completeOnboarding();

            await page.getByTestId('@account-menu/btc/normal/0/label').click();
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                'Bitcoin #1',
            );
            await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.passThroughInitMetadata(p.provider);
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                'already existing label',
            );

            await metadataMock.setFileContent(
                p.file,
                {
                    ...metadataMock.defaultFileContent,
                    accountLabel: 'label from another window',
                },
                metadataMock.defaultAesKey,
            );

            await page.clock.fastForward(METADATA_LABELING.FETCH_INTERVAL);
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText(
                'label from another window',
            );
        });
    });
});
