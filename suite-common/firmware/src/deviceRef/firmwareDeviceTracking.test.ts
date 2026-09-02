import { DeviceModelInternal } from '@trezor/device-utils';

import {
    type FirmwareDeviceTrackingEvent,
    FirmwareDeviceTrackingPhase,
    type FirmwareDeviceTrackingState,
    firmwareDeviceTrackingInitialState,
    firmwareDeviceTrackingReducer,
} from './firmwareDeviceTracking';
import { mockDevice } from '../../mocks';

const run = (
    events: FirmwareDeviceTrackingEvent[],
    initialState: FirmwareDeviceTrackingState = firmwareDeviceTrackingInitialState,
) => events.reduce(firmwareDeviceTrackingReducer, initialState);

const deviceInNormalMode = mockDevice({ path: '1' });

describe('firmwareDeviceTrackingReducer', () => {
    it('starts idle and stays idle for events that arrive before arming', () => {
        const state = run([
            { type: 'device-connect', device: deviceInNormalMode, isOnlyCandidate: true },
            { type: 'device-disconnect', device: deviceInNormalMode },
        ]);

        expect(state).toEqual(firmwareDeviceTrackingInitialState);
    });

    it('follows the device through a bootloader reboot when the device id survives', () => {
        // T2T1 keeps reporting `device_id` in bootloader mode, so the reconnect is provable.
        const inBootloader = mockDevice({ path: '2', isBootloader: true });

        const state = run([
            { type: 'arm', device: deviceInNormalMode },
            { type: 'device-disconnect', device: deviceInNormalMode },
            { type: 'device-connect', device: inBootloader, isOnlyCandidate: false },
        ]);

        expect(state.phase).toBe(FirmwareDeviceTrackingPhase.Tracking);
        expect(state.currentRef?.path).toBe('2');
        // The original ref must survive so the wallet instance is not lost.
        expect(state.initialRef?.path).toBe('1');
    });

    it('adopts a wiped device on the model heuristic when it is the only candidate', () => {
        // Switching firmware type changes the vendor header, which wipes the device and gives it a
        // new `device_id`. Nothing links the two beyond model and transport.
        const wiped = mockDevice({ path: '2', deviceId: 'DEVICE_B' });

        const state = run([
            { type: 'arm', device: deviceInNormalMode },
            { type: 'device-disconnect', device: deviceInNormalMode },
            { type: 'device-connect', device: wiped, isOnlyCandidate: true },
        ]);

        expect(state.phase).toBe(FirmwareDeviceTrackingPhase.Tracking);
        expect(state.currentRef?.deviceId).toBe('DEVICE_B');
    });

    it('refuses to guess when it is not the only candidate', () => {
        const wiped = mockDevice({ path: '2', deviceId: 'DEVICE_B' });

        const state = run([
            { type: 'arm', device: deviceInNormalMode },
            { type: 'device-disconnect', device: deviceInNormalMode },
            { type: 'device-connect', device: wiped, isOnlyCandidate: false },
        ]);

        expect(state.phase).toBe(FirmwareDeviceTrackingPhase.AwaitingReconnect);
        expect(state.currentRef?.deviceId).toBe('DEVICE_A');
    });

    it('still adopts once a provable match shows up after an ambiguous one', () => {
        const wiped = mockDevice({ path: '2', deviceId: 'DEVICE_B' });
        const original = mockDevice({ path: '4' });

        const state = run([
            { type: 'arm', device: deviceInNormalMode },
            { type: 'device-disconnect', device: deviceInNormalMode },
            { type: 'device-connect', device: wiped, isOnlyCandidate: false },
            { type: 'device-connect', device: original, isOnlyCandidate: false },
        ]);

        expect(state.phase).toBe(FirmwareDeviceTrackingPhase.Tracking);
        expect(state.currentRef?.path).toBe('4');
    });

    it('does not adopt a device of a different model', () => {
        const otherModel = mockDevice({
            path: '2',
            deviceId: 'DEVICE_B',
            internalModel: DeviceModelInternal.T1B1,
        });

        const state = run([
            { type: 'arm', device: deviceInNormalMode },
            { type: 'device-disconnect', device: deviceInNormalMode },
            { type: 'device-connect', device: otherModel, isOnlyCandidate: true },
        ]);

        expect(state.phase).toBe(FirmwareDeviceTrackingPhase.AwaitingReconnect);
    });

    it('does not adopt a device on a different transport', () => {
        // A Bluetooth device appearing while we wait for a USB replug is a different connection,
        // not the device coming back.
        const overBluetooth = mockDevice({
            path: '2',
            deviceId: 'DEVICE_B',
            apiType: 'bluetooth',
        });

        const state = run([
            { type: 'arm', device: deviceInNormalMode },
            { type: 'device-disconnect', device: deviceInNormalMode },
            { type: 'device-connect', device: overBluetooth, isOnlyCandidate: true },
        ]);

        expect(state.phase).toBe(FirmwareDeviceTrackingPhase.AwaitingReconnect);
    });

    it('matches a Bluetooth device on its transport id even after a wipe', () => {
        const overBluetooth = mockDevice({
            path: '1',
            apiType: 'bluetooth',
            transportId: 'BLE_MAC',
        });
        const wipedOverBluetooth = mockDevice({
            path: '2',
            deviceId: 'DEVICE_B',
            apiType: 'bluetooth',
            transportId: 'BLE_MAC',
        });

        const state = run([
            { type: 'arm', device: overBluetooth },
            { type: 'device-disconnect', device: overBluetooth },
            { type: 'device-connect', device: wipedOverBluetooth, isOnlyCandidate: false },
        ]);

        expect(state.phase).toBe(FirmwareDeviceTrackingPhase.Tracking);
        expect(state.currentRef?.path).toBe('2');
    });

    it('follows every reconnect cycle of a multi-stage update', () => {
        // normal -> bootloader -> (intermediary) bootloader -> normal
        const stages = ['2', '3', '4'].map(path => mockDevice({ path }));

        const state = stages.reduce(
            (accumulator, stage) =>
                run(
                    [
                        {
                            type: 'device-disconnect',
                            device: mockDevice({ path: accumulator.currentRef!.path }),
                        },
                        { type: 'device-connect', device: stage, isOnlyCandidate: false },
                    ],
                    accumulator,
                ),
            run([{ type: 'arm', device: deviceInNormalMode }]),
        );

        expect(state.currentRef?.path).toBe('4');
        expect(state.initialRef?.path).toBe('1');
    });

    it('ignores a disconnect of an unrelated device', () => {
        const bystander = mockDevice({ path: '9', deviceId: 'DEVICE_C' });

        const state = run([
            { type: 'arm', device: deviceInNormalMode },
            { type: 'device-disconnect', device: bystander },
        ]);

        expect(state.phase).toBe(FirmwareDeviceTrackingPhase.Tracking);
    });

    it('keeps the wallet instance the update started from across a reconnect', () => {
        const reconnected = mockDevice({ path: '2' });

        const state = run([
            { type: 'arm', device: { ...deviceInNormalMode, instance: 2 } as never },
            { type: 'device-disconnect', device: deviceInNormalMode },
            { type: 'device-connect', device: reconnected, isOnlyCandidate: false },
        ]);

        expect(state.currentRef?.instance).toBe(2);
    });
});
