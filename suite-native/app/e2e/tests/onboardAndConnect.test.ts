import { conditionalDescribe } from '@suite-common/test-utils';

import { deviceChecksDisabledState } from '../fixtures/deviceChecksDisabledState';
import { deviceChecksEnabledState } from '../fixtures/deviceChecksEnabledState';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onDevicePrompt } from '../pageObjects/devicePromptActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { disconnectTrezorUserEnv, getModelFromEnv, mergePreloadedReduxState, openApp, prepareTrezorEmulator } from '../utils';

const preloadedState = mergePreloadedReduxState(
    getModelFromEnv() === 'T3W1' ? deviceChecksDisabledState : deviceChecksEnabledState, // skip device checks on T3W1 because we are using 2-main FW
);

conditionalDescribe(
    device.getPlatform() === 'android',
    'Go through onboarding and connect Trezor.',
    () => {
        beforeAll(async () => {
            await prepareTrezorEmulator();

            await openApp({
                newInstance: true,
                args: {
                    preloadedState,
                },
            });
        });

        afterAll(async () => {
            await disconnectTrezorUserEnv();
            await device.terminateApp();
        });

        it('Navigate to dashboard', async () => {
            await onOnboarding.finishOnboarding();
            
            if (getModelFromEnv() === 'T3W1') {
                await onDevicePrompt.allowConnectToTrezor();
                await onDeviceOnboarding.enterTHPPairingCode();
            }

            await waitFor(element(by.id('@screen/CoinEnablingInit')))
                .toBeVisible()
                .withTimeout(10000);

            await onCoinEnabling.handleCoinEnablingInit(['btc', 'eth']);
        });
    },
);
