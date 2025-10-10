import { conditionalDescribe } from '@suite-common/test-utils';

import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { openApp, prepareTrezorEmulator } from '../utils';

conditionalDescribe(
    device.getPlatform() === 'android',
    'Go through onboarding and connect Trezor.',
    () => {
        beforeAll(async () => {
            await openApp({ newInstance: true });
            await prepareTrezorEmulator();
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
