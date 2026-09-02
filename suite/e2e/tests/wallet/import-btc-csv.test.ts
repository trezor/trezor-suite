import fs from 'fs';
import path from 'path';

import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { csvToJson } from '../../support/csvToJson';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Import a BTC csv file', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ metadataMock, onboardingPage, settingsPage, metadataPage }) => {
        await metadataMock.start(MetadataProvider.DROPBOX);
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await metadataPage.enableLegacyLabeling(MetadataProvider.DROPBOX);
    });

    test(
        'Go to BTC send form and import a csv',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify that a user can successfully import a BTC csv file.',
                category: TestCategory.UriLinkHandler,
                priority: TestPriority.Low,
                stream: TestStream.Wallet,
            }),
        },
        async ({ page, dashboardPage, walletPage }) => {
            await walletPage.openAccount();
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
                convertedData[0]?.address ?? '',
            );
            await expect(page.getByTestId('outputs.0.amount')).toBeVisible();
            await expect(page.getByTestId('outputs.0.amount')).toHaveValue(
                convertedData[0]?.amount ?? '',
            );
            await expect(page.getByTestId('outputs.0.fiat')).toBeVisible();
            await expect(page.getByTestId('outputs.0.fiat')).toHaveValue(/^[\d,]+(\.\d+)?$/);
            await expect(page.getByTestId('@metadata/outputLabel/0/hover-container')).toBeVisible();
            await expect(page.getByTestId('@metadata/outputLabel/0/hover-container')).toHaveText(
                convertedData[0]?.label ?? '',
            );

            await expect(page.getByTestId('outputs.1.address')).toBeVisible();
            await expect(page.getByTestId('outputs.1.address')).toHaveValue(
                convertedData[1]?.address ?? '',
            );
            await expect(page.getByTestId('outputs.1.amount')).toBeVisible();
            await expect(page.getByTestId('outputs.1.amount')).toHaveValue(/^\d+(\.\d+)?$/);
            await expect(page.getByTestId('outputs.1.fiat')).toBeVisible();
            await expect(page.getByTestId('outputs.1.fiat')).toHaveValue(
                convertedData[1]?.amount ?? '',
            );
            await expect(page.getByTestId('@metadata/outputLabel/1/hover-container')).toBeVisible();
            await expect(page.getByTestId('@metadata/outputLabel/1/hover-container')).toHaveText(
                convertedData[1]?.label ?? '',
            );
        },
    );
});
