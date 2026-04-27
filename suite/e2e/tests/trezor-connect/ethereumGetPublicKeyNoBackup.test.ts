import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

// Regression test for https://github.com/trezor/trezor-suite/issues/26869
// Verifies that `suppressBackupWarning` actually suppresses the no-backup
// confirmation modal in the Connect popup flow when the device's seed has
// not been backed up.
test.describe(
    'TrezorConnect.ethereumGetPublicKey - suppressBackupWarning',
    // Tagged @T2T1 only because the trezor-user-env `needs_backup: true` setup
    // is currently exercised only on T2T1 emulators (see suite/e2e/tests/backup/t2t1-*).
    { tag: ['@T2T1', '@desktopOnly'] },
    () => {
        test.use({
            electronConf: { exposeConnectWs: true },
            deviceSetup: { needs_backup: true, mnemonic: 'mnemonic_12' },
        });

        test.beforeEach(async ({ onboardingPage }) => {
            await onboardingPage.completeOnboarding();
            await test.step('Initialize TrezorConnect', async () => {
                await TrezorConnect.init({
                    manifest: {
                        appUrl: 'http://localhost:8080',
                        email: '',
                        appName: 'Tester',
                    },
                    coreMode: 'suite-desktop',
                    debug: true,
                });
            });
        });

        test('honors suppressBackupWarning across no-backup scenarios', async ({
            connectPermissionsModal,
            noBackupModal,
            device,
        }) => {
            await test.step('shows no-backup modal when display requested without suppress', async () => {
                const res = TrezorConnect.ethereumGetPublicKey({
                    path: "m/44'/60'/0'",
                    showOnTrezor: true,
                });

                await connectPermissionsModal.rememberCheckbox.click();
                await connectPermissionsModal.confirmButton.click();
                await expect(noBackupModal.takeRiskButton).toBeVisible();
                await noBackupModal.takeRiskButton.click();
                await device.pressYes();

                expect(await res).toMatchObject({ success: true });
            });

            await test.step('skips no-backup modal when suppressBackupWarning is true', async () => {
                const res = TrezorConnect.ethereumGetPublicKey({
                    path: "m/44'/60'/0'",
                    showOnTrezor: true,
                    suppressBackupWarning: true,
                });

                // Device prompt should appear directly without the no-backup modal in between.
                await device.pressYes();

                expect(await res).toMatchObject({ success: true });
                await expect(noBackupModal.takeRiskButton).toBeHidden();
            });

            await test.step('skips no-backup modal when not displaying on device', async () => {
                const res = TrezorConnect.ethereumGetPublicKey({
                    path: "m/44'/60'/0'",
                });

                expect(await res).toMatchObject({ success: true });
                await expect(noBackupModal.takeRiskButton).toBeHidden();
            });
        });
    },
);
