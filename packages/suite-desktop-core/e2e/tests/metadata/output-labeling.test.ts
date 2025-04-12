import fs from 'fs';

import { OutputLabelId } from '../../support/enums/outputLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';

test.describe('Metadata - Output labeling', { tag: ['@group=metadata', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ metadataMock }) => {
        await metadataMock.start(MetadataProvider.DROPBOX);
    });

    test('dropbox provider', async ({ page, onboardingPage, metadataPage, walletPage }) => {
        await onboardingPage.completeOnboarding();

        await walletPage.openAccount();

        await metadataPage.output.clickAddLabelButton(OutputLabelId.BitcoinDefault1, 0);

        await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);

        await metadataPage.output.fillLabelInput('mnau cool label');

        // go to legacy account 6, it has txs with multiple outputs
        await page.getByTestId('@account-menu/legacy').click();
        await walletPage.openAccount({ symbol: 'btc', type: 'legacy', atIndex: 5 });

        // Try to open multiple metadata inputs
        await metadataPage.output.clickAddLabelButton(OutputLabelId.BitcoinLegacy6, 0);
        await metadataPage.output.clickAddLabelButton(OutputLabelId.BitcoinLegacy6, 1);

        // Only one metadata input should be visible at a time
        await expect(metadataPage.output.metadataInput).toHaveCount(1);

        await metadataPage.output.addLabel(OutputLabelId.BitcoinLegacy6, 2, 'output 3');
        await expect(
            metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy6, 2),
        ).toContainText('output 3');

        // label "send to myself tx"
        await walletPage.openAccount({ symbol: 'btc', type: 'legacy', atIndex: 9 });
        await metadataPage.output.addLabel(OutputLabelId.BitcoinLegacy10, 0, 'really to myself');
        await expect(
            metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy10, 0),
        ).toContainText('really to myself');

        // Test that label can be edited and submitted by enter
        await metadataPage.output.editLabel(OutputLabelId.BitcoinLegacy10, 0, 'edited');
        await expect(
            metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy10, 0),
        ).toContainText('edited');

        // Check that there is a copy address button
        await metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy10, 0).click();
        await expect(
            metadataPage.output.outputDropdownCopyAddress(OutputLabelId.BitcoinLegacy10, 0),
        ).toBeVisible();

        // Test that label can be edited and submitted by submit button
        await metadataPage.output.outputDropdownEditLabel(OutputLabelId.BitcoinLegacy10, 0).click();
        await metadataPage.output.fillLabelInput('submitted by button', { useButton: true });
        await expect(
            metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy10, 0),
        ).toContainText('submitted by button');

        await metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy10, 0).click();
        await metadataPage.output.outputDropdownEditLabel(OutputLabelId.BitcoinLegacy10, 0).click();
        await metadataPage.output.metadataInput.clear();
        await metadataPage.output.metadataInput.fill('write something that wont be saved');
        await metadataPage.output.metadataCancelButton.click();
        await expect(
            metadataPage.output.outputLabel(OutputLabelId.BitcoinLegacy10, 0),
        ).toContainText('submitted by button');

        await onboardingPage.completeTransactionOnboarding();
        await walletPage.exportTransactions('csv');

        const download = await page.waitForEvent('download');
        const downloadPath = await download.path();
        const fileContent = fs.readFileSync(downloadPath, 'utf8');
        const expectedSubstr = '1PmVvr5DNVYJygtDT7J312qmxpa5pceu9E;submitted by button';
        expect(fileContent).toContain(expectedSubstr);
        expect(typeof fileContent).toBe('string');
    });
});
