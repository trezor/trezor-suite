// `expect` keyword is already used by jest.
import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { openApp } from '../utils';
import { onOnboarding } from '../pageObjects/onboardingActions';

const TREZOR_DEVICE_LABEL = 'Trezor T - Tester';
// Contains only one BTC account with a single transaction to make the discovery as fast as possible.
const SIMPLE_SEED = 'immune enlist rule measure fan swarm mandate track point menu security fan';
const platform = device.getPlatform();

describe('Go through onboarding and connect Trezor.', () => {
    beforeAll(async () => {
        if (platform === 'android') {
            // Prepare Trezor device for test scenario and turn it off.
            await TrezorUserEnvLink.disconnect();
            await TrezorUserEnvLink.connect();
            await TrezorUserEnvLink.startEmu({ wipe: true });
            await TrezorUserEnvLink.setupEmu({
                label: TREZOR_DEVICE_LABEL,
                mnemonic: SIMPLE_SEED,
            });
            await TrezorUserEnvLink.startBridge();
            await TrezorUserEnvLink.stopEmu();
        }

        await openApp({ newInstance: true });
    });

    afterAll(async () => {
        if (platform === 'android') {
            await TrezorUserEnvLink.stopEmu();
        }
        await device.terminateApp();
    });

    it('Navigate to dashboard', async () => {
        await onOnboarding.finishOnboarding();

        if (platform === 'android') {
            await TrezorUserEnvLink.startEmu();

            await waitFor(element(by.id('skip-view-only-mode')))
                .toBeVisible()
                .withTimeout(60000); // communication between connected Trezor and app takes some time.

            await element(by.id('skip-view-only-mode')).tap();

            await detoxExpect(element(by.id('@home/portfolio/graph'))); // discovery finished and graph is visible
        } else {
            await detoxExpect(element(by.text('Hi there!'))).toBeVisible();
            await detoxExpect(element(by.text('Get started'))).toBeVisible();
        }
    });
});
