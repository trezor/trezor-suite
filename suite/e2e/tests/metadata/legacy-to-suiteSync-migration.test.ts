import { mnemonic12Fixtures } from '@suite-common/e2e-evolu-client';
import { TestStream } from '@trezor/e2e-utils';

import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

const localLabel = 'local account label';
const expectedAccount = mnemonic12Fixtures.buildExpectedAccount({ label: localLabel });
const expectedOutput = mnemonic12Fixtures.buildExpectedOutput({
    txId: 'aa545d95cf07892e1ae70b40e856b9b476f703e2e20647d0985830fd7b734393',
    outputIndex: '0',
    label: 'local output label',
});
const expectedAddress = mnemonic12Fixtures.buildExpectedAddress({
    address: 'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa',
    label: 'local address label',
});

test.describe('Labeling migration', { tag: ['@T3W1', '@T3T1', '@desktopOnly'] }, () => {
    test.use({ wipeEvoluRelay: true });

    test.beforeEach(async ({ onboardingPage, settingsPage, metadataPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.toggleDebugModeInSettings();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await metadataPage.enableLegacyLabeling(MetadataProvider.LOCAL);
    });

    test(
        'Migration from local file',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, dashboardPage, walletPage, metadataPage, evoluClient }) => {
            await test.step('Set up local file labeling', async () => {
                await walletPage
                    .accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 })
                    .click();
                await expect(
                    walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
                ).toHaveText('Bitcoin #1');

                // wait until account page is fully loaded
                await expect(walletPage.fiatAmount).toBeVisible();
                await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
            });

            await test.step('Add legacy account label', async () => {
                await metadataPage.account.metadataInput.fill(localLabel);
                await page.keyboard.press('Enter');
                await expect(
                    walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
                ).toHaveText(localLabel);
                await metadataPage.account.successIconIsVisible(AccountLabelId.BitcoinDefault1);
            });

            await test.step('Change output label', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
                await metadataPage.output.changeLabel({
                    outputId: expectedOutput.txId,
                    txNumber: Number(expectedOutput.outputIndex),
                    label: expectedOutput.label,
                });
                await expect(
                    metadataPage.output.outputLabel(
                        expectedOutput.txId,
                        Number(expectedOutput.outputIndex),
                    ),
                ).toHaveText(expectedOutput.label);
            });

            await test.step('Change address label', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
                await walletPage.receiveButton.click();
                await metadataPage.address.changeLabel({
                    address: expectedAddress.address,
                    label: expectedAddress.label,
                });
                await expect
                    .soft(metadataPage.address.label(expectedAddress.address))
                    .toHaveText(expectedAddress.label);
            });

            await test.step('Switch to Suite Sync labeling and confirm legacy label is migrated', async () => {
                await metadataPage.enableSuiteSync();
                await expect(
                    page.getByTestId('@toast/legacy-labeling-migration-success'),
                ).toHaveTranslation('TR_LABELING_MIGRATION_SUCCESS', {
                    values: { added: '3', skipped: '0' },
                    timeout: 30000,
                });

                await expect(
                    walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
                ).toHaveText(localLabel);
            });

            await test.step('Change wallet label to trigger device prompt for Suite Sync keys', async () => {
                await dashboardPage.openDeviceSwitcher();
                await metadataPage.wallet.changeLabel({
                    index: 0,
                    label: 'label4key',
                    confirmSuiteSync: true,
                });
                await expect.soft(metadataPage.wallet.walletLabel(0)).toHaveText('label4key');
                await dashboardPage.deviceSwitchingCloseButton.click();
            });

            await test.step('Verify output label is synced', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
                await expect
                    .soft(
                        metadataPage.output.outputLabel(
                            expectedOutput.txId,
                            Number(expectedOutput.outputIndex),
                        ),
                    )
                    .toHaveText(expectedOutput.label);
            });

            await test.step('Verify receive address label is synced', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
                await walletPage.receiveButton.click();
                await expect
                    .soft(metadataPage.address.label(expectedAddress.address))
                    .toHaveText(expectedAddress.label);
            });

            await test.step('Verify data are sync to Relay', async () => {
                await evoluClient.init({ ownerSecret: mnemonic12Fixtures.ownerSecret });
                await evoluClient.expectInTable('account', [expectedAccount], { softExpect: true });
                await evoluClient.expectInTable('output', [expectedOutput], { softExpect: true });
                await evoluClient.expectInTable('address', [expectedAddress], { softExpect: true });
            });
        },
    );
});
