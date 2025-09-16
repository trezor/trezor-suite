import { conditionalDescribe } from '@suite-common/test-utils';

import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { disconnectTrezorUserEnv, openApp, prepareTrezorEmulator } from '../utils';

conditionalDescribe(
    device.getPlatform() === 'android',
    'Go through onboarding and connect Trezor.',
    () => {
        beforeAll(async () => {
            await prepareTrezorEmulator();

            await openApp({ newInstance: true });
        });

        afterAll(async () => {
            await disconnectTrezorUserEnv();
            await device.terminateApp();
        });

        it('Navigate to dashboard', async () => {
            await onOnboarding.finishOnboarding();

            await waitFor(element(by.id('@screen/CoinEnablingInit')))
                .toBeVisible()
                .withTimeout(10000);

            await onCoinEnabling.handleCoinEnablingInit(['btc', 'eth']);
        });
    },
);
