import { test } from '@playwright/test';
import path from 'path';

import { expect } from '../support/customMatchers';

/**
 * Importing a CSV into the send form.
 *
 * Converted from `suite/e2e/tests/wallet/import-btc-csv.test.ts`, which completed onboarding,
 * enabled Bitcoin, connected a Dropbox metadata provider and opened the send form before it could
 * pick a file. The parsing and currency mapping this covers had no test at any level; the e2e
 * asserted them by reading the populated send-form inputs.
 *
 * Still only in the e2e test: that the resolved rows reach the send form's output fields, and the
 * output labels that go through the metadata provider.
 */
const CSV_FIXTURE = path.join(__dirname, '../fixtures/btcTest.csv');

test('parses a CSV and maps display symbols to network symbols', async ({ mount }) => {
    const component = await mount('importCsv/CsvImport');

    await component.locator('input[type=file]').setInputFiles(CSV_FIXTURE);
    await component.getByTestId('@import-csv/import-button').click();

    // `BTC` resolves to the `btc` network symbol; `USD` matches no network so it is left alone.
    await expect(component.getByTestId('parsed-outputs')).toHaveValue(
        JSON.stringify([
            {
                address: 'bc1qfcjv620stvtzjeelg26ncgww8ks49zy8lracjz',
                amount: '0.31337',
                currency: 'btc',
                label: 'meow',
            },
            {
                address: 'bc1quqgq44wq0zjh6d920zs42nsy4n4ev5vt8nxke4',
                amount: '0.5',
                currency: 'USD',
                label: 'meow2',
            },
        ]),
    );
});

test('the import button stays disabled until a file is chosen', async ({ mount }) => {
    const component = await mount('importCsv/CsvImport');

    await expect(component.getByTestId('@import-csv/import-button')).toBeDisabled();

    await component.locator('input[type=file]').setInputFiles(CSV_FIXTURE);

    await expect(component.getByTestId('@import-csv/import-button')).toBeEnabled();
});
