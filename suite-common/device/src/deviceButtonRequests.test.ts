import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { asDeviceUniquePath } from '@trezor/connect';

import { deviceActions } from './deviceActions';
import {
    type DeviceReducerState,
    type DeviceRootState,
    deviceReducerInitialState,
    prepareDeviceReducer,
} from './deviceReducer';
import { selectDeviceButtonRequests } from './deviceSelectors';

const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);
const A = asDeviceUniquePath('A');
const B = asDeviceUniquePath('B');

const reduce = (state: DeviceReducerState, actions: { type: string }[]) =>
    actions.reduce((acc, action) => deviceReducer(acc, action), state);

describe('deviceReducer button requests (path-keyed map)', () => {
    it('adds a button request under the physical-device path', () => {
        const state = reduce(deviceReducerInitialState, [
            deviceActions.addButtonRequest({
                path: A,
                buttonRequest: { code: 'ButtonRequest_SignTx' },
            }),
        ]);

        expect(state.buttonRequestsByPath).toEqual({ A: [{ code: 'ButtonRequest_SignTx' }] });
    });

    it('appends multiple requests per path and keeps paths independent', () => {
        const state = reduce(deviceReducerInitialState, [
            deviceActions.addButtonRequest({
                path: A,
                buttonRequest: { code: 'ButtonRequest_Other' },
            }),
            deviceActions.addButtonRequest({
                path: A,
                buttonRequest: { code: 'ButtonRequest_SignTx' },
            }),
            deviceActions.addButtonRequest({
                path: B,
                buttonRequest: { code: 'ButtonRequest_PinEntry' },
            }),
        ]);

        expect(state.buttonRequestsByPath).toEqual({
            A: [{ code: 'ButtonRequest_Other' }, { code: 'ButtonRequest_SignTx' }],
            B: [{ code: 'ButtonRequest_PinEntry' }],
        });
    });

    it('clears a path bucket on removeButtonRequests', () => {
        const state = reduce(deviceReducerInitialState, [
            deviceActions.addButtonRequest({
                path: A,
                buttonRequest: { code: 'ButtonRequest_SignTx' },
            }),
            deviceActions.addButtonRequest({
                path: B,
                buttonRequest: { code: 'ButtonRequest_SignTx' },
            }),
            deviceActions.removeButtonRequests({ path: A }),
        ]);

        expect(state.buttonRequestsByPath).toEqual({ B: [{ code: 'ButtonRequest_SignTx' }] });
    });

    it('is a no-op for a missing path', () => {
        const state = reduce(deviceReducerInitialState, [
            deviceActions.removeButtonRequests({ path: undefined }),
        ]);

        expect(state.buttonRequestsByPath).toEqual({});
    });

    it('prunes the disconnected device path bucket', () => {
        const withRequests = reduce(deviceReducerInitialState, [
            deviceActions.addButtonRequest({
                path: A,
                buttonRequest: { code: 'ButtonRequest_SignTx' },
            }),
        ]);

        const state = deviceReducer(
            withRequests,
            deviceActions.deviceDisconnect(mockSuiteDevice({ path: 'A' })),
        );

        expect(state.buttonRequestsByPath).toEqual({});
    });
});

describe('selectDeviceButtonRequests', () => {
    const stateWith = (
        selectedPath: string | undefined,
        buttonRequestsByPath: Record<string, unknown>,
    ): DeviceRootState =>
        ({
            device: {
                ...deviceReducerInitialState,
                selectedDevice:
                    selectedPath === undefined
                        ? undefined
                        : mockSuiteDevice({ path: selectedPath }),
                buttonRequestsByPath,
            },
        }) as unknown as DeviceRootState;

    it('returns the selected device path bucket', () => {
        const state = stateWith('A', { A: [{ code: 'ButtonRequest_SignTx' }] });

        expect(selectDeviceButtonRequests(state)).toEqual([{ code: 'ButtonRequest_SignTx' }]);
    });

    it('returns empty for a blanked (remembered-disconnected) empty path', () => {
        const state = stateWith('', { '': [{ code: 'ButtonRequest_SignTx' }] });

        expect(selectDeviceButtonRequests(state)).toEqual([]);
    });

    it('returns empty when the selected device has no bucket', () => {
        const state = stateWith('A', { B: [{ code: 'ButtonRequest_SignTx' }] });

        expect(selectDeviceButtonRequests(state)).toEqual([]);
    });
});
