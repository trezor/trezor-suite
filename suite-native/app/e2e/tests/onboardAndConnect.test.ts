// `expect` keyword is already used by jest.
import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { openApp } from '../utils';

const TREZOR_DEVICE_LABEL = 'Trezor T - Tester';
const platform = device.getPlatform();

describe('Go through onboarding and connect Trezor.', () => {
    beforeAll(async () => {
        if (platform === 'android') {
            // Prepare Trezor device for test scenario and turn it off.
            await TrezorUserEnvLink.api.trezorUserEnvDisconnect();
            await TrezorUserEnvLink.api.trezorUserEnvConnect();
            await TrezorUserEnvLink.api.startEmu({ wipe: true });
            await TrezorUserEnvLink.api.setupEmu({ label: TREZOR_DEVICE_LABEL });
            await TrezorUserEnvLink.api.startBridge();
            await TrezorUserEnvLink.api.stopEmu();
        }

        await openApp();
    });

    afterAll(async () => {
        if (platform === 'android') {
            await TrezorUserEnvLink.api.stopEmu();
        }
        await device.terminateApp();
    });

    it('Redirect from first to second screen', async () => {
        await waitFor(element(by.id('@onboarding/Welcome/nextBtn')))
            .toBeVisible()
            .withTimeout(10000); // Debug build takes some time to load.

        await element(by.id('@onboarding/Welcome/nextBtn')).tap();

        if (platform === 'android') {
            await element(by.id('@onboarding/ConnectTrezor/nextBtn')).tap();
        } else {
            await element(by.id('@onboarding/TrackBalances/nextBtn')).tap();
        }

        await element(by.id('@onboarding/AboutReceiveCoinsFeature/nextBtn')).tap();

        if (platform === 'android') {
            await element(by.id('@onboarding/TrackBalances/nextBtn')).tap();
        }

        await detoxExpect(element(by.id('@onboarding/UserDataConsent/allow'))).toBeVisible();
        await element(by.id('@onboarding/UserDataConsent/allow')).tap();

        try {
            await element(by.id('reject-biometrics')).tap();
        } catch {
            // Android emulator does not support biometrics, so the sheet is not displayed at all.
            console.warn(
                'Biometrics not supported by device, skipping close of biometrics bottom sheet.',
            );
        }

        if (platform === 'android') {
            device.disableSynchronization();
            await TrezorUserEnvLink.api.startEmu();

            await waitFor(element(by.text(TREZOR_DEVICE_LABEL)))
                .toBeVisible()
                .withTimeout(10000); // communication between connected Trezor and app takes some time.

            await detoxExpect(element(by.text('My portfolio balance'))).toBeVisible();
        } else {
            await detoxExpect(element(by.text('Hi there!'))).toBeVisible();
            await detoxExpect(element(by.text('Get started'))).toBeVisible();
        }
    });
});
