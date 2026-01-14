import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { deviceChecksDisabledState } from '../fixtures/deviceChecksDisabledState';
import { deviceChecksEnabledState } from '../fixtures/deviceChecksEnabledState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT3T1 } from '../fixtures/regtestDiscoveryFinishedStateT3T1';
import { regtestDiscoveryFinishedStateT3W1 } from '../fixtures/regtestDiscoveryFinishedStateT3W1';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onPassphrase } from '../pageObjects/passphraseModule';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { getModelFromEnv, wait, waitForVisible } from '../support/utils';

const PIN = '1234';
const AUTO_LOCK_DELAY_MS = 10_000; // 5 seconds for testing
const TEST_PASSPHRASE = 'E2E:device actions locked test';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    getModelFromEnv() === 'T3T1'
        ? regtestDiscoveryFinishedStateT3T1
        : regtestDiscoveryFinishedStateT3W1,
    getModelFromEnv() === 'T3W1' ? deviceChecksDisabledState : deviceChecksEnabledState,
);

conditionalDescribe(
    device.getPlatform() === 'android' || getModelFromEnv() === 'T3W1',
    'Device actions with locked device [@deviceActions]',
    () => {
        describe('PIN required scenarios', () => {
            beforeEach(async () => {
                await openApp({ args: { preloadedState } });
                // Setup emulator with PIN protection enabled
                await prepareTrezorEmulator({ pin: PIN, passphrase_protection: true });
                await TrezorUserEnvLink.applySettings({ auto_lock_delay_ms: AUTO_LOCK_DELAY_MS });
                await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
            });

            it('Add hidden wallet requires PIN after device lock', async () => {
                // Wait for auto-lock to trigger
                await wait(AUTO_LOCK_DELAY_MS);

                // Try to add passphrase wallet - should require PIN
                await onPassphrase.openNewPassphraseFlow();

                await waitForVisible(by.id('@screen/PinMatrix'));
                // Device should request PIN unlock
                // Enter PIN on emulator
                await TrezorUserEnvLink.inputEmu(PIN);

                // After PIN, passphrase form should appear
                await onPassphrase.expectEnterPassphraseScreen();
                await onPassphrase.enterPassphrase(TEST_PASSPHRASE);

                await onPassphrase.expectConfirmPassphraseOnDeviceRequest();
                await onPassphrase.confirmPassphraseOnEmu();

                await onPassphrase.expectEmptyPassphraseWalletScreen();
                await onPassphrase.openEmptyPassphraseWalletAndConfirmBestPractices();

                await onPassphrase.expectEmptyPassphraseWalletConfirmationScreen();
                await onPassphrase.enterPassphrase(TEST_PASSPHRASE);

                await onPassphrase.expectConfirmPassphraseOnDeviceRequest();
                await onPassphrase.confirmPassphraseOnEmu();

                await onPassphrase.expectSwitcherSubheader('Passphrase wallet #1');
            });
        });
    },
);
