import fs from 'fs';

import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { OutputLabelId } from '../../../support/enums/outputLabelId';
import { expect, test } from '../../../support/fixtures';
import { MetadataProvider } from '../../../support/mocks/metadataMock';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Metadata - Output labeling', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ metadataMock }) => {
        await metadataMock.start(MetadataProvider.DROPBOX);
    });

    test(
        'dropbox provider',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify metadata output labeling functionality with Dropbox provider.',
                category: TestCategory.Settings,
                priority: TestPriority.High,
            }),
        },
        async ({ page, onboardingPage, metadataPage, walletPage }) => {
            await onboardingPage.completeOnboarding();
            await metadataPage.enableLegacyLabeling(MetadataProvider.DROPBOX);
            await walletPage.openAccount();
            await metadataPage.output.clickAddLabelButton(OutputLabelId.BitcoinDefault1, 0);
            await metadataPage.output
                .outputMetadataInput(OutputLabelId.BitcoinDefault1, 0)
                .fill('mnau cool label');
            await page.keyboard.press('Enter');

            await test.step('Go to legacy account 6, it has txs with multiple outputs', async () => {
                await page.getByTestId('@account-menu/legacy').click();
                await walletPage.openAccount({ symbol: 'btc', type: 'legacy', atIndex: 5 });
            });

            await test.step('Add label to output 3 and verify', async () => {
                await metadataPage.output.changeLabel({
                    outputId: OutputLabelId.BitcoinLegacy6,
                    txNumber: 2,
                    label: 'output 3',
                });
                await expect(
                    metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy6, 2),
                ).toContainText('output 3');
            });

            await test.step('Label "send to myself tx"', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'legacy', atIndex: 9 });
                await metadataPage.output.changeLabel({
                    outputId: OutputLabelId.BitcoinLegacy10,
                    txNumber: 0,
                    label: 'really to myself',
                });
                await expect(
                    metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy10, 0),
                ).toContainText('really to myself');
            });

            await test.step('Test that label can be edited and submitted by enter', async () => {
                await metadataPage.output.changeLabel({
                    outputId: OutputLabelId.BitcoinLegacy10,
                    txNumber: 0,
                    label: 'edited',
                });
                await expect(
                    metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy10, 0),
                ).toContainText('edited');
            });

            await test.step('Test that label can be edited and submitted by submit button', async () => {
                await metadataPage.output.clickAddLabelButton(OutputLabelId.BitcoinLegacy10, 0);
                await metadataPage.output
                    .outputMetadataInput(OutputLabelId.BitcoinLegacy10, 0)
                    .fill('submitted by button');
                await metadataPage.output.metadataSubmitButton.click();
                await expect(
                    metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy10, 0),
                ).toContainText('submitted by button');
            });

            await test.step('Test canceling label edit does not change label', async () => {
                await metadataPage.output.clickAddLabelButton(OutputLabelId.BitcoinLegacy10, 0);
                await metadataPage.output
                    .outputMetadataInput(OutputLabelId.BitcoinLegacy10, 0)
                    .clear();
                await metadataPage.output
                    .outputMetadataInput(OutputLabelId.BitcoinLegacy10, 0)
                    .fill('write something that wont be saved');
                await metadataPage.output.metadataCancelButton.click();
                await expect(
                    metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy10, 0),
                ).toContainText('submitted by button');
            });

            await test.step('Export transactions and verify CSV contains label', async () => {
                await onboardingPage.completeTransactionOnboarding();
                await walletPage.exportTransactions('csv');

                const download = await page.waitForEvent('download');
                const downloadPath = await download.path();
                const fileContent = fs.readFileSync(downloadPath, 'utf8');
                const expectedSubstr = '1PmVvr5DNVYJygtDT7J312qmxpa5pceu9E,submitted by button';
                expect(fileContent).toContain(expectedSubstr);
                expect(typeof fileContent).toBe('string');
            });
        },
    );
});
