import { mnemonic12Fixtures } from '@suite-common/e2e-evolu-client';

import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';

const { accountSeed, ownerSecret, ownerId } = mnemonic12Fixtures;

test.describe('Labeling migration', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({ wipeEvoluRelay: true });

    test.beforeEach(async ({ metadataMock, evoluClient, onboardingPage }) => {
        await metadataMock.start(MetadataProvider.DROPBOX);
        await test.step('Seed Evolu relay server', () => {
            evoluClient.init({ ownerSecret });
            evoluClient.writeTo('account', accountSeed);
            evoluClient.seedQuotaManagerData({ ownerId });
        });
        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
    });

    test('Migration from Dropbox', async ({ page, walletPage, metadataPage }) => {
        await test.step('Set up Dropbox labeling', async () => {
            await walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }).click();
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('Bitcoin #1');

            // wait until account page is fully loaded
            await expect(walletPage.fiatAmount).toBeVisible();
            await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);
        });

        await test.step('Add legacy account label', async () => {
            await metadataPage.account.metadataInput.fill('new dropbox label');
            await page.keyboard.press('Enter');
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('new dropbox label');
            await metadataPage.account.successIconIsVisible(AccountLabelId.BitcoinDefault1);
        });

        await test.step('Switch to Suite Sync labeling and confirm legacy label is retained', async () => {
            await metadataPage.enableSuiteSync();
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText(accountSeed.label);
        });
    });
});
