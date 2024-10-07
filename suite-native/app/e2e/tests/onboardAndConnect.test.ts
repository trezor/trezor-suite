// `expect` keyword is already used by jest.
import { expect as detoxExpect } from 'detox';

import { disconnectTrezorUserEnv, openApp, prepareTrezorEmulator } from '../utils';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onCoinEnablingInit } from '../pageObjects/coinEnablingActions';

const platform = device.getPlatform();

describe('Go through onboarding and connect Trezor.', () => {
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

        if (platform === 'android') {
            await waitFor(element(by.id('@screen/CoinEnablingInit')))
                .toBeVisible()
                .withTimeout(10000);

            await onCoinEnablingInit.waitForScreen();

            await onCoinEnablingInit.enableNetwork('btc');
            await onCoinEnablingInit.enableNetwork('eth');

            await onCoinEnablingInit.clickOnConfirmButton();

            await waitFor(element(by.id('skip-view-only-mode')))
                .toBeVisible()
                .withTimeout(90000); // Wait for discovery to finish

            await element(by.id('skip-view-only-mode')).tap();

            await detoxExpect(element(by.id('@home/portfolio/graph')));
        } else {
            await detoxExpect(element(by.text('Hi there!'))).toBeVisible();
            await detoxExpect(element(by.text('Get started'))).toBeVisible();
        }
    });
});
