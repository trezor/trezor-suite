import { strict as assert } from 'node:assert';

import { type PreloadedState } from '@suite-native/state';
import { type Features } from '@trezor/connect';

type PrepareEmulatorPreloadedStateParams = {
    preloadedState: string;
    emulatorFeatures: Pick<Features, 'device_id' | 'internal_model'>;
};

export const prepareEmulatorPreloadedState = ({
    preloadedState,
    emulatorFeatures,
}: PrepareEmulatorPreloadedStateParams): string => {
    const state: PreloadedState = JSON.parse(preloadedState);
    const fixtureDevices = state?.device?.devices?.filter(
        device =>
            device?.connected &&
            device.features?.internal_model === emulatorFeatures.internal_model,
    );
    const fixtureDeviceIds = new Set(
        fixtureDevices?.flatMap(device => (device?.id ? [device.id] : [])),
    );

    if (fixtureDeviceIds.size === 0) return preloadedState;

    assert(fixtureDeviceIds.size === 1, 'Expected one connected physical device in the fixture');
    assert(emulatorFeatures.device_id, 'Emulator did not report a device ID');

    for (const device of [...(fixtureDevices ?? []), state?.device?.selectedDevice]) {
        if (!device?.id || !fixtureDeviceIds.has(device.id)) continue;

        device.connected = false;
        device.available = false;
        device.path = '';
        delete device.thp;
        if (device.state) delete device.state.sessionId;
    }

    let serializedState = JSON.stringify(state);
    // Device identity is also embedded in account keys, session IDs and keyed state objects.
    for (const fixtureDeviceId of fixtureDeviceIds) {
        serializedState = serializedState.replaceAll(fixtureDeviceId, emulatorFeatures.device_id);
    }

    return serializedState;
};
