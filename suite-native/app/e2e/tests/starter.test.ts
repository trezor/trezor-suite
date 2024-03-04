import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { openApp, sleep } from '../utils';

const TREZOR_DEVICE_LABEL = 'Trezor T - Tester';

describe('Start discovery', () => {
    beforeAll(async () => {
        // Prepare device for tests and close it.
        await TrezorUserEnvLink.api.trezorUserEnvConnect();
        await TrezorUserEnvLink.api.startEmu({ wipe: true });
        await TrezorUserEnvLink.api.setupEmu({ label: TREZOR_DEVICE_LABEL });
        await TrezorUserEnvLink.api.startBridge();
        await TrezorUserEnvLink.api.stopEmu();

        await openApp();
    });

    afterAll(async () => {
        // Close trezor-user-env connection.
        await TrezorUserEnvLink.api.trezorUserEnvDisconnect();
    });

    it('Redirect from first to second screen', async () => {
        await element(by.id('@onboarding/Welcome/nextBtn')).tap();

        //  TODO: handle IOS screen

        await detoxExpect(element(by.id('@onboarding/ConnectTrezor/nextBtn'))).toBeVisible();

        await element(by.id('@onboarding/ConnectTrezor/nextBtn')).tap();

        await element(by.id('@onboarding/AboutReceiveCoinsFeature/nextBtn')).tap();

        await element(by.id('@onboarding/TrackBalances/nextBtn')).tap();

        await detoxExpect(element(by.id('@onboarding/UserDataConsent/allow'))).toBeVisible();

        await element(by.id('@onboarding/UserDataConsent/allow')).tap();

        try {
            await element(by.id('reject-biometrics')).tap();
        } catch {
            console.warn(
                'Biometrics not supported by device, skipping close of biometrics bottom sheet.',
            );
        }

        await device.setURLBlacklist([]);
        await TrezorUserEnvLink.api.startEmu();

        await sleep(8000);

        await device.disableSynchronization();

        await detoxExpect(element(by.text(TREZOR_DEVICE_LABEL))).toBeVisible();
        await detoxExpect(element(by.text('My portfolio balance'))).toBeVisible();

        await TrezorUserEnvLink.api.trezorUserEnvDisconnect();
    });
});
