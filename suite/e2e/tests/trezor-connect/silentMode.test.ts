import { ElectronApplication, Page } from '@playwright/test';

import { messages } from '@suite/intl';
import TrezorConnect from '@trezor/connect-web';

import { DeviceFixture } from '../../support/device';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

// Counts desktopApi 'app/focus' requests so we can assert whether Suite is brought to the
// foreground. On Electron the spy runs in the main process (contextBridge freezes the renderer's
// desktopApi so we can't wrap it there). On the Tauri target there is no Electron main process, so
// the injected window.desktopApi (support/tauriDesktopApi.ts) increments window.__appFocusCalls and
// we read it from the page instead.
const installAppFocusSpy = (page: Page, electronApp?: ElectronApplication) =>
    electronApp
        ? electronApp.evaluate(({ ipcMain }) => {
              (global as any).__appFocusCalls = 0;
              ipcMain.on('app/focus', () => {
                  (global as any).__appFocusCalls = ((global as any).__appFocusCalls ?? 0) + 1;
              });
          })
        : page.evaluate(() => {
              (window as any).__appFocusCalls = 0;
          });

const resetAppFocusSpy = (page: Page, electronApp?: ElectronApplication) =>
    electronApp
        ? electronApp.evaluate(() => {
              (global as any).__appFocusCalls = 0;
          })
        : page.evaluate(() => {
              (window as any).__appFocusCalls = 0;
          });

const getAppFocusCallCount = (page: Page, electronApp?: ElectronApplication): Promise<number> =>
    electronApp
        ? electronApp.evaluate(() => (global as any).__appFocusCalls ?? 0)
        : page.evaluate(() => (window as any).__appFocusCalls ?? 0);

const signMessage = () =>
    TrezorConnect.signMessage({
        path: "m/44'/0'/0'/0/0",
        coin: 'btc',
        message: 'hello',
    });

const confirmSignMessageOnDevice = async (page: Page, device: DeviceFixture) => {
    await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'visible' });
    // T3T1/T3W1: swipe through address screen, then message screen, then hold to confirm.
    await device.pressContinue();
    await device.pressContinue();
    await device.pressYes();
    await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'hidden' });
};

test.describe('TrezorConnect silent mode', { tag: ['@T3T1', '@T3W1', '@desktopOnly'] }, () => {
    test.use({ electronConf: { exposeConnectWs: true } });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.toggleDebugModeInSettings();

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

    test(
        'Silent mode suppresses Suite focus on subsequent calls',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Suite Connect: Silent mode prevents Suite from being brought to foreground during ongoing calls.',
            }),
        },
        async ({ settingsPage, connectPermissionsModal, page, device, electronApp }) => {
            await settingsPage.navigateTo('connect');
            await page.getByTestId('@settings/connect-apps/tabs/trezor-connect').click();
            await page.getByTestId('@settings/connect-apps/no-apps').waitFor({ state: 'visible' });

            await installAppFocusSpy(page, electronApp);

            // First call: grant permissions, remember WITHOUT silent mode.
            // Also verify the silent mode checkbox is hidden until Remember is ticked.
            signMessage();
            await expect(connectPermissionsModal.processParagraph).toHaveText(
                /^(node|MainThread)$/,
            );
            await expect(connectPermissionsModal.silentModeCheckbox).toBeHidden();
            await connectPermissionsModal.rememberCheckbox.click();
            await expect(connectPermissionsModal.silentModeCheckbox).toHaveTranslation(
                'TR_CONNECT_APP_SILENT_MODE',
            );
            await connectPermissionsModal.confirmButton.click();
            await confirmSignMessageOnDevice(page, device);

            // Baseline: silent mode OFF — subsequent call should bring Suite to foreground.
            await resetAppFocusSpy(page, electronApp);
            signMessage();
            await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'visible' });
            await expect
                .poll(() => getAppFocusCallCount(page, electronApp), { timeout: 5000 })
                .toBeGreaterThan(0);
            await device.pressContinue();
            await device.pressContinue();
            await device.pressYes();
            await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'hidden' });

            // Turn silent mode ON via the settings dropdown.
            await page.getByTestId(`@settings/connect-apps/0/dropdown`).click();
            // todo: it looks like data-test is not passed down to list items in dropdown
            const silentModeLabel = messages['TR_CONNECT_APP_SILENT_MODE'].defaultMessage;
            await page.getByText(silentModeLabel).click();
            await expect(async () => {
                const permissions = await page.getReduxObject('connectPopup.permissions');
                expect(permissions[0]).toMatchObject({ silentMode: true });
            }).toPass();

            // Silent mode ON — Suite must NOT focus. The confirm-on-device prompt still
            // renders (silent mode only suppresses window focus, not Suite UI).
            await resetAppFocusSpy(page, electronApp);
            signMessage();
            await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'visible' });
            // Focus fires via a useEffect chained through async appIsVisible() IPC —
            // wait briefly so that chain can settle before asserting zero.
            await page.waitForTimeout(300);
            expect(await getAppFocusCallCount(page, electronApp)).toBe(0);
            await device.pressContinue();
            await device.pressContinue();
            await device.pressYes();
            await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'hidden' });
        },
    );
});
