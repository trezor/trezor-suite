import { type DeviceRootState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Discovery, type DiscoveryStatus } from '@suite-common/wallet-types';
import { type DeviceUniquePath } from '@trezor/connect';

import { type DiscoveryRootState } from '../discoveryReducer';
import {
    selectDiscoveryForSelectedDevice,
    selectHasRunningDiscovery,
    selectIsCreatingNewPassphraseWallet,
} from '../discoverySelectors';

const TEST_PATH = 'device-id:1' as DeviceUniquePath;
const OTHER_PATH = 'device-id:2' as DeviceUniquePath;

const mockDevice = (overrides: Partial<TrezorDevice> = {}): TrezorDevice =>
    ({
        id: 'device-1',
        type: 'acquired',
        connected: true,
        path: TEST_PATH,
        features: {},
        ...overrides,
    }) as unknown as TrezorDevice;

const createState = ({
    selectedDevice,
    discoveries,
}: {
    selectedDevice: TrezorDevice | undefined;
    discoveries: Discovery;
}): DiscoveryRootState & DeviceRootState =>
    ({
        device: {
            devices: selectedDevice ? [selectedDevice] : [],
            persistentDeviceData: [],
            selectedDevice,
        },
        wallet: {
            discovery: discoveries,
        },
    }) as unknown as DiscoveryRootState & DeviceRootState;

describe('selectDiscoveryForSelectedDevice', () => {
    it('returns the same discovery reference across calls when state is unchanged', () => {
        const discovery: DiscoveryStatus = { status: 'starting' };
        const state = createState({
            selectedDevice: mockDevice(),
            discoveries: { [TEST_PATH]: discovery },
        });

        const first = selectDiscoveryForSelectedDevice(state);
        const second = selectDiscoveryForSelectedDevice(state);

        expect(second).toBe(first);
        expect(first).toBe(discovery);
    });

    it('returns undefined when there is no discovery for the selected device path', () => {
        const state = createState({
            selectedDevice: mockDevice(),
            discoveries: { [OTHER_PATH]: { status: 'starting' } },
        });

        expect(selectDiscoveryForSelectedDevice(state)).toBeUndefined();
    });

    it('returns undefined when there is no selected device', () => {
        const state = createState({
            selectedDevice: undefined,
            discoveries: { [TEST_PATH]: { status: 'starting' } },
        });

        expect(selectDiscoveryForSelectedDevice(state)).toBeUndefined();
    });
});

describe('selectHasRunningDiscovery', () => {
    it('returns true when the selected device is in a non-terminal discovery state', () => {
        const state = createState({
            selectedDevice: mockDevice(),
            discoveries: { [TEST_PATH]: { status: 'starting' } },
        });

        expect(selectHasRunningDiscovery(state)).toBe(true);
    });

    it('returns false when the discovery is complete/failed/cancelled', () => {
        const terminalStatuses: DiscoveryStatus[] = [
            { status: 'complete' },
            { status: 'failed' },
            { status: 'cancelled' },
        ];

        for (const terminal of terminalStatuses) {
            const state = createState({
                selectedDevice: mockDevice(),
                discoveries: { [TEST_PATH]: terminal },
            });

            expect(selectHasRunningDiscovery(state)).toBe(false);
        }
    });

    it('returns false when there is no discovery for the selected device', () => {
        const state = createState({
            selectedDevice: mockDevice(),
            discoveries: {},
        });

        expect(selectHasRunningDiscovery(state)).toBe(false);
    });

    it('returns a stable primitive across repeated calls with unchanged state', () => {
        const state = createState({
            selectedDevice: mockDevice(),
            discoveries: { [TEST_PATH]: { status: 'starting' } },
        });

        expect(selectHasRunningDiscovery(state)).toBe(selectHasRunningDiscovery(state));
    });
});

describe('selectIsCreatingNewPassphraseWallet', () => {
    it('returns the isAddingHiddenWallet flag from the active discovery', () => {
        const state = createState({
            selectedDevice: mockDevice(),
            discoveries: {
                [TEST_PATH]: {
                    status: 'starting',
                    isAddingHiddenWallet: true,
                },
            },
        });

        expect(selectIsCreatingNewPassphraseWallet(state)).toBe(true);
    });

    it('returns undefined when no discovery exists for the selected device', () => {
        const state = createState({
            selectedDevice: mockDevice(),
            discoveries: {},
        });

        expect(selectIsCreatingNewPassphraseWallet(state)).toBeUndefined();
    });
});
