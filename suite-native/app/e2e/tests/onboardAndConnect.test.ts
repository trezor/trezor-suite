import { conditionalDescribe } from '@suite-common/test-utils';

import { deviceChecksDisabledState } from '../fixtures/deviceChecksDisabledState';
import { deviceChecksEnabledState } from '../fixtures/deviceChecksEnabledState';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onDevicePrompt } from '../pageObjects/devicePromptActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import {
    getModelFromEnv,
    openApp,
    preparePreloadedReduxState,
    prepareTrezorEmulator,
} from '../utils';

const preloadedState = preparePreloadedReduxState(
    getModelFromEnv() === 'T3W1' ? deviceChecksDisabledState : deviceChecksEnabledState, // skip device checks on T3W1 because we are using 2-main FW
);

conditionalDescribe(
    device.getPlatform() === 'android',
    'Go through onboarding and connect Trezor.',
    () => {
        beforeAll(async () => {
            await openApp({ args: { preloadedState } });
            await prepareTrezorEmulator();
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
