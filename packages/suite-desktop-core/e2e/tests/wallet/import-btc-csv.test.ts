import fs from 'fs';
import path from 'path';

import { csvToJson } from '../../support/csvToJson';
import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataProviderMock';

test.describe('Import a BTC csv file', { tag: ['@group=wallet', '@webOnly'] }, () => {
    test.beforeEach(async ({ metadataProviderMock, onboardingPage, dashboardPage }) => {
        await metadataProviderMock.start(MetadataProvider.DROPBOX);
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('Go to BTC send form and import a csv', async ({
        page,
        dashboardPage,
        metadataPage,
        walletPage,
    }) => {
        await walletPage.accountButton().click();
        await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
        await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);

        await walletPage.sendButton.click();

        await page.getByTestId('@send/header-dropdown').click();
        await page.getByTestId('@send/header-dropdown/import').click();

        const csvFilePath = path.join(__dirname, '../../fixtures/btcTest.csv');
        await dashboardPage.modal.locator('input[type=file]').setInputFiles(csvFilePath);
        await dashboardPage.modal.waitFor({ state: 'detached' });

        const csvData = fs.readFileSync(csvFilePath, 'utf8');
        const convertedData = csvToJson(csvData);
        await expect(page.getByTestId('outputs.0.address')).toBeVisible();
        await expect(page.getByTestId('outputs.0.address')).toHaveValue(convertedData[0].address);
        await expect(page.getByTestId('outputs.1.address')).toBeVisible();
        await expect(page.getByTestId('outputs.1.address')).toHaveValue(convertedData[1].address);
    });
});
