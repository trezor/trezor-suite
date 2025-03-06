// `expect` keyword is already used by jest.
import { expect as detoxExpect } from 'detox';

import { conditionalDescribe } from '@suite-common/test-utils';

import { onAlertSheet } from '../pageObjects/alertSheetActions';
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
            disconnectTrezorUserEnv();
            await device.terminateApp();
        });

        it('Navigate to dashboard', async () => {
            await onOnboarding.finishOnboarding();

            await waitFor(element(by.id('@screen/CoinEnablingInit')))
                .toBeVisible()
                .withTimeout(10000);

            await onCoinEnabling.waitForInitScreen();

            await onCoinEnabling.toggleNetwork('btc');
            await onCoinEnabling.toggleNetwork('eth');

            await onCoinEnabling.clickOnConfirmButton();

            await onAlertSheet.skipViewOnlyMode();

            await detoxExpect(element(by.id('@home/portfolio/header')));
        });
    },
);
