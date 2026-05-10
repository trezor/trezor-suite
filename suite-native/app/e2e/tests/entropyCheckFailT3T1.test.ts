import { expect as detoxExpect } from 'detox';

import { type DeviceReducerState, deviceReducerInitialState } from '@suite-common/device';
import { Model } from '@trezor/trezor-user-env-link';

import { deviceChecksEnabledState } from '../fixtures/deviceChecksEnabledState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { wait, waitForVisible } from '../support/utils';

const getPreloadedState = (payload: DeviceReducerState['simulatedEntropyCheckFail']) =>
    preparePreloadedReduxState(onboardingCompletedState, deviceChecksEnabledState, {
        device: { ...deviceReducerInitialState, simulatedEntropyCheckFail: payload },
    });

const LONG_RUNNING_TEST_TIMEOUT = 5 * 60 * 1000; // [ms]

describe('Simulated entropy check failure on T3T1 [@androidOnly @T3T1]', () => {
    beforeEach(async () => {
        await prepareTrezorEmulator({ model: Model.T3T1, seed: '' });
    });

    it(
        'Device compromised (entropy-mismatch)',
        async () => {
            await openApp({
                args: {
                    preloadedState: getPreloadedState({
                        success: false,
                        error: { code: 'Failure_EntropyCheck', message: 'SIMULATED ERROR' },
                    }),
                },
            });
            await onDeviceOnboarding.proceedToCreateOrRecoverCrossroads();
            await onDeviceOnboarding.startCreatingWallet();

            await onDeviceOnboarding.waitForDeviceCompromisedModal();
        },
        LONG_RUNNING_TEST_TIMEOUT,
    );

    it(
        'Transport error (device disconnected during entropy check)',
        async () => {
            // note that this specific string is one of the ignored errors, see getIsIgnoredEntropyCheckError
            const mockedError = 'device disconnected during action';
            await openApp({
                args: {
                    preloadedState: getPreloadedState({
                        success: false,
                        error: { code: 'Failure_EntropyCheck', message: mockedError },
                    }),
                },
            });
            await onDeviceOnboarding.proceedToCreateOrRecoverCrossroads();
            await onDeviceOnboarding.startCreatingWallet();

            await waitForVisible(by.id('@toast'));
            await detoxExpect(element(by.id('@toast'))).toHaveText(mockedError);
            await wait(500); // we do not expect any navigation, so ensure no navigation occurs
            await onDeviceOnboarding.waitForWalletCreationScreen(); // still on the same screen (can be retried)
        },
        LONG_RUNNING_TEST_TIMEOUT,
    );
});
