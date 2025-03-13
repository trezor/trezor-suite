import { expect, test } from '../../support/fixtures';

const migrateFromVersion = 'release/22.5/web';
const migrateToVersion = 'develop/web';
const walletPassphrase = 'doggo je dobros';
const btcAddress = 'bc1qkmdl2z9u503r6r5s6kyrczje60e2ye7ne7q53e';
const suiteDevInstance = 'https://dev.suite.sldev.cz/suite-web';
const workaroundBtcAddressInputSelector = 'outputs.0.address';

test.describe('Database migration', { tag: ['@group=migrations', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { passphrase_protection: true, mnemonic: 'mnemonic_all' } });

    test(`Db migration between: ${migrateFromVersion} => ${migrateToVersion}`, async ({
        page,
        onboardingPage,
        dashboardPage,
        walletPage,
        trezorUserEnvLink,
    }) => {
        const discoveryBar = page.locator('[data-test="\\@wallet\\/discovery-progress-bar"] div');

        await test.step(`Load suite in old version ${migrateFromVersion}`, async () => {
            await page.goto(`${suiteDevInstance}/${migrateFromVersion}`);
            await page.locator('[data-test="@onboarding/continue-button"]').click();
            await page.locator('[data-test="@onboarding/exit-app-button"]').click();
            await expect(page.locator('[data-test="@suite/loading"]')).not.toBeVisible();
            await page.locator('[data-test="@passphrase-type/standard"]').click();
            await discoveryBar.waitFor({ state: 'visible', timeout: 45000 });
            await discoveryBar.waitFor({ state: 'hidden', timeout: 45000 });
        });

        await test.step('Change Theme to dark', async () => {
            await page.locator('[data-test="@suite/menu/settings"]').click();
            await page.locator('[data-test="@theme/color-scheme-select/input"]').click();
            await page.locator('[data-test="@theme/color-scheme-select/option/dark"]').click();
            await expect(
                page.locator('[data-test="@theme/color-scheme-select/input"]'),
            ).toContainText('Dark');
        });

        await test.step('Add passphrase wallet', async () => {
            await page.locator('[data-test="@menu/switch-device"]').click();
            await expect(page.locator('[data-test="@modal"]')).toBeVisible();
            await page.locator('[data-test="@switch-device/add-hidden-wallet-button"]').click();
            await page.locator('[data-test="@passphrase/input"]').fill(walletPassphrase);
            await page.locator('[data-test="@passphrase/hidden/submit-button"]').click();
            await page.waitForTimeout(500);
            await trezorUserEnvLink.pressYes();
            await trezorUserEnvLink.pressYes();
            await discoveryBar.waitFor({ state: 'visible', timeout: 45000 });
            await discoveryBar.waitFor({ state: 'hidden', timeout: 45000 });
            await page.locator('[data-test="@suite/menu/wallet-index"]').click();
        });

        await test.step('Fill in send form', async () => {
            await page.locator('[data-test="@wallet/menu/wallet-send"]').click();
            await page.locator('[data-test="outputs[0].address"]').fill(btcAddress);
            await page.waitForTimeout(500); // wait has to be for a state save to happen
            await page.locator('[data-test="@wallet/menu/close-button"]').last().click();
        });

        const originalTxLabel = await test.step('Get address of first transaction', async () => {
            const metadataOutputLabel = page
                .locator('[data-test^="@metadata/outputLabel"] > span')
                .first();
            await metadataOutputLabel.scrollIntoViewIfNeeded();
            await expect(metadataOutputLabel).toBeVisible();

            return metadataOutputLabel.textContent();
        });

        await test.step('Remember the wallet and stop Emulator', async () => {
            await page.locator('[data-test="@menu/switch-device"]').click();
            const firstHiddenWallet = page
                .locator('[data-test^="@switch-device/wallet-on-index"]')
                .filter({ hasText: 'Hidden wallet #1' });
            await firstHiddenWallet.locator('[data-test*="toggle-remember-switch"]').click();
            await expect(firstHiddenWallet.locator('input')).toBeChecked();
            await trezorUserEnvLink.stopEmu();
        });

        await test.step(`Navigate to new version ${migrateToVersion} and check wallet status`, async () => {
            await page.goto(`${suiteDevInstance}/${migrateToVersion}`);
            await expect(dashboardPage.graph).toBeVisible({ timeout: 30_000 });
            await page.getByTestId('@account-menu/normal').click();
            await walletPage.openAccount({ symbol: 'btc' });
            await dashboardPage.openDeviceSwitcher();
            await expect(
                page.getByTestId('@menu/switch-device').getByTestId('@deviceStatus-disconnected'),
            ).toBeVisible();
            await expect(dashboardPage.walletAtIndex(0)).toContainText('Passphrase wallet #1');
        });

        await test.step('Compare the address of the first transaction', async () => {
            await dashboardPage.deviceSwitchingCloseButton.click();
            const firstTxLabel = page.getByTestId('@wallet/transaction/target-address').first();
            await expect(firstTxLabel).toBeVisible();
            const afterMigrationTxLabel = await firstTxLabel.textContent();
            expect(afterMigrationTxLabel).toBe(originalTxLabel);
        });

        // go to receive tab, trigger show address to make sure passphrase is properly cached
        // -> no passphrase prompt should be displayed
        await test.step('Reveal receive address and see warning "device not connected"', async () => {
            await walletPage.receiveButton.click();
            await walletPage.revealAddressButton.click();
            await expect(page.getByTestId('@modal')).toBeVisible();
            await page.getByTestId('@modal/close-button').click();
            await expect(page.getByTestId('@modal')).not.toBeVisible();
        });

        await test.step('Reconnect Emulator', async () => {
            await trezorUserEnvLink.startEmu();
            await onboardingPage.disableFirmwareHashCheck({ skipSuiteLoadedCheck: true });
            await dashboardPage.openDeviceSwitcher();
            await expect(page.getByTestId('@deviceStatus-connected')).toBeVisible();
            await dashboardPage.deviceSwitchingCloseButton.click();
            await page.getByTestId('@account-subpage/back').last().click();
        });

        await test.step('Verify send form has still the original address filled in', async () => {
            await walletPage.openSendFormButton.click();
            await expect(page.getByTestId(workaroundBtcAddressInputSelector)).toHaveValue(
                btcAddress,
            );
            await page.getByTestId('@account-subpage/back').last().click();
        });

        await test.step('Verify theme is still dark', async () => {
            await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(23, 23, 23)');
        });
    });
});
