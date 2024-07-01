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
            await TrezorUserEnvLink.api.trezorUserEnvDisconnect();
            await TrezorUserEnvLink.api.trezorUserEnvConnect();
            await TrezorUserEnvLink.api.startEmu({ wipe: true });
            await TrezorUserEnvLink.api.setupEmu({
                label: TREZOR_DEVICE_LABEL,
                mnemonic: SIMPLE_SEED,
            });
            await TrezorUserEnvLink.api.startBridge();
            await TrezorUserEnvLink.api.stopEmu();
        }

        await openApp({ newInstance: true });
    });

    afterAll(async () => {
        if (platform === 'android') {
            await TrezorUserEnvLink.api.stopEmu();
        }
        await device.terminateApp();
    });

    it('Navigate to dashboard', async () => {
        await onOnboarding.finishOnboarding();

        if (platform === 'android') {
            await TrezorUserEnvLink.api.startEmu();

            await waitFor(element(by.text(TREZOR_DEVICE_LABEL)))
                .toBeVisible()
                .withTimeout(10000); // communication between connected Trezor and app takes some time.

            await detoxExpect(element(by.text('Bitcoin'))).toBeVisible();
        } else {
            await detoxExpect(element(by.text('Hi there!'))).toBeVisible();
            await detoxExpect(element(by.text('Get started'))).toBeVisible();
        }
    });
});
