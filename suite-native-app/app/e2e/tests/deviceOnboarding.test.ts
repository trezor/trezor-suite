import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { btcCoinEnabled } from '../fixtures/btcCoinEnabled';
import { deviceChecksEnabledState } from '../fixtures/deviceChecksEnabledState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onHome } from '../pageObjects/homeActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';

const finishOnboardingFlow = async () => {
    // Create Pin
    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.inputEmu('123');
    await TrezorUserEnvLink.inputEmu('123');
    await TrezorUserEnvLink.pressYes();

    await onDeviceOnboarding.waitForCongratulationsScreen();
    await onDeviceOnboarding.dismissCongratulationsScreen();

    await onHome.waitForScreen();
};

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    deviceChecksEnabledState,
    btcCoinEnabled,
);

const LONG_RUNNING_TEST_TIMEOUT = 7 * 60 * 1000; // [ms]

describe('Device onboarding [@androidOnly @T3T1 @T3W1]', () => {
    beforeEach(async () => {
        await prepareTrezorEmulator({ seed: '' });
        await openApp({ args: { preloadedState } });
        await onDeviceOnboarding.proceedToCreateOrRecoverCrossroads();
    });

    it(
        'Create Wallet',
        async () => {
            await onDeviceOnboarding.startCreatingWallet();

            // Wallet Backup Recap
            await onDeviceOnboarding.waitForWalletBackupRecapScreen();

            await onDeviceOnboarding.goToNextWalletBackupRecapStep(1);
            await onDeviceOnboarding.goToNextWalletBackupRecapStep(2);
            await onDeviceOnboarding.goToNextWalletBackupRecapStep(3);

            await onDeviceOnboarding.pressHoldToConfirmButton();

            await finishOnboardingFlow();
        },
        LONG_RUNNING_TEST_TIMEOUT,
    );

    it('Recover Wallet', async () => {
        await onDeviceOnboarding.selectRecoverWalletOption();
        await onDeviceOnboarding.confirmRecoveryInstructions();

        // On device recovery
        await TrezorUserEnvLink.pressYes();
        await TrezorUserEnvLink.selectNumOfWordsEmu(12);
        await TrezorUserEnvLink.pressYes();
        for (let i = 0; i < 12; i++) {
            await TrezorUserEnvLink.inputEmu('all');
        }
        await TrezorUserEnvLink.pressYes();

        await onDeviceOnboarding.waitForWalletRecoveryRecapScreen();
        await onDeviceOnboarding.goToNextWalletRecoveryRecapStep(1);
        await onDeviceOnboarding.pressHoldToConfirmButton();

        await finishOnboardingFlow();
    });
});
