import fs from 'fs';
import path from 'path';

import { csvToJson } from '../../support/csvToJson';
import { AccountLabelId } from '../../support/enums/accountLabelId';
import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Import a BTC csv file', { tag: ['@group=wallet', '@webOnly'] }, () => {
    test.beforeEach(async ({ metadataMock, onboardingPage }) => {
        await metadataMock.start(MetadataProvider.DROPBOX);
        await onboardingPage.completeOnboarding();
    });

    test(
        'Go to BTC send form and import a csv',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify that a user can successfully import a BTC csv file.',
                category: TestCategory.UriLinkHandler,
                priority: TestPriority.Low,
            }),
        },
        async ({ page, dashboardPage, metadataPage, walletPage }) => {
            await walletPage.openAccount();
            await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);

            await walletPage.openSendFormButton.click();

            await page.getByTestId('@send/header-dropdown').click();
            await page.getByTestId('@send/header-dropdown/import').click();

            const csvFilePath = path.join(__dirname, '../../fixtures/btcTest.csv');
            await dashboardPage.modal.locator('input[type=file]').setInputFiles(csvFilePath);
            await dashboardPage.modal.getByTestId('@import-csv/import-button').click();

            const csvData = fs.readFileSync(csvFilePath, 'utf8');
            const convertedData = csvToJson(csvData);
            await expect(page.getByTestId('outputs.0.address')).toBeVisible();
            await expect(page.getByTestId('outputs.0.address')).toHaveValue(
                convertedData[0].address,
            );
            await expect(page.getByTestId('outputs.1.address')).toBeVisible();
            await expect(page.getByTestId('outputs.1.address')).toHaveValue(
                convertedData[1].address,
            );
        },
    );
});
