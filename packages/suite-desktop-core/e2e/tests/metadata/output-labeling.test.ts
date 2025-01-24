import fs from 'fs';

import { OutputLabelId } from '../../support/enums/outputLabelId';
import { test, expect } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataProviderMock';

test.describe('Metadata - Output labeling', { tag: ['@group=metadata', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ metadataProviderMock }) => {
        await metadataProviderMock.start(MetadataProvider.DROPBOX);
    });

    test('dropbox provider', async ({ page, onboardingPage, dashboardPage, metadataPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();

        await page.getByTestId('@account-menu/btc/normal/0').click();

        await metadataPage.clickAddOutputLabelButton(OutputLabelId.BitcoinDefault1, 0);

        await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);

        await metadataPage.fillLabelInput('mnau cool label');

        // go to legacy account 6, it has txs with multiple outputs
        await page.getByTestId('@account-menu/legacy').click();
        await page.getByTestId('@account-menu/btc/legacy/5/label').click();

        // Try to open multiple metadata inputs
        await metadataPage.clickAddOutputLabelButton(OutputLabelId.BitcoinLegacy6, 0);
        await metadataPage.clickAddOutputLabelButton(OutputLabelId.BitcoinLegacy6, 1);

        // Only one metadata input should be visible at a time
        await expect(metadataPage.metadataInput).toHaveCount(1);

        await metadataPage.addOutputLabel(OutputLabelId.BitcoinLegacy6, 2, 'output 3');
        await expect(metadataPage.outputLabel(OutputLabelId.BitcoinLegacy6, 2)).toContainText(
            'output 3',
        );

        // label "send to myself tx"
        await page.getByTestId('@account-menu/btc/legacy/9/label').click();
        await metadataPage.addOutputLabel(OutputLabelId.BitcoinLegacy10, 0, 'really to myself');
        await expect(metadataPage.outputLabel(OutputLabelId.BitcoinLegacy10, 0)).toContainText(
            'really to myself',
        );

        // Test that label can be edited and submitted by enter
        await metadataPage.editOutputLabel(OutputLabelId.BitcoinLegacy10, 0, 'edited');
        await expect(metadataPage.outputLabel(OutputLabelId.BitcoinLegacy10, 0)).toContainText(
            'edited',
        );

        // Check that there is a copy address button
        await metadataPage.outputLabel(OutputLabelId.BitcoinLegacy10, 0).click();
        await expect(
            metadataPage.outputDropdownCopyAddress(OutputLabelId.BitcoinLegacy10, 0),
        ).toBeVisible();

        // Test that label can be edited and submitted by submit button
        await metadataPage.outputDropdownEditLabel(OutputLabelId.BitcoinLegacy10, 0).click();
        await metadataPage.fillLabelInput('submitted by button', { useButton: true });
        await expect(metadataPage.outputLabel(OutputLabelId.BitcoinLegacy10, 0)).toContainText(
            'submitted by button',
        );

        await metadataPage.outputLabel(OutputLabelId.BitcoinLegacy10, 0).click();
        await metadataPage.outputDropdownEditLabel(OutputLabelId.BitcoinLegacy10, 0).click();
        await metadataPage.metadataInput.clear();
        await metadataPage.metadataInput.fill('write something that wont be saved');
        await metadataPage.metadataCancelButton.click();
        await expect(metadataPage.outputLabel(OutputLabelId.BitcoinLegacy10, 0)).toContainText(
            'submitted by button',
        );

        await page.getByTestId('@wallet/accounts/export-transactions/dropdown').click();
        await page.getByTestId('@wallet/accounts/export-transactions/csv').click();

        const download = await page.waitForEvent('download');
        const downloadPath = await download.path();
        const fileContent = fs.readFileSync(downloadPath, 'utf8');
        const expectedSubstr = '1PmVvr5DNVYJygtDT7J312qmxpa5pceu9E;submitted by button';
        expect(fileContent).toContain(expectedSubstr);
        expect(typeof fileContent).toBe('string');
    });

    test.afterEach(async ({ metadataProviderMock }) => {
        await metadataProviderMock.stop();
    });
});
