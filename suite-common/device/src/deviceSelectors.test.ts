import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DEFAULT_FLAGSHIP_MODEL } from '@trezor/device';
import { DeviceModelInternal } from '@trezor/device-utils';

import { type DeviceRootState, deviceReducerInitialState } from './deviceReducer';
import {
    selectAccountSigningDevice,
    selectDeviceModelWithFlagshipFallback,
    selectStandardWalletByDeviceId,
    selectStandardWalletDescriptorByDeviceId,
} from './deviceSelectors';

const createWallet = (overrides: Partial<TrezorDevice>) =>
    ({
        id: 'device-1',
        connected: true,
        instance: 1,
        useEmptyPassphrase: true,
        state: { staticSessionId: 'standard@device-1:1' },
        ...overrides,
    }) as unknown as TrezorDevice;

const createState = (devices: TrezorDevice[]): DeviceRootState => ({
    device: { ...deviceReducerInitialState, devices },
});

const standardWallet = createWallet({});
const hiddenWallet = createWallet({
    instance: 2,
    useEmptyPassphrase: false,
    state: { staticSessionId: 'hidden@device-1:2' },
});

describe(selectDeviceModelWithFlagshipFallback.name, () => {
    it('returns the model of the selected device', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: mockSuiteDevice({}, { internal_model: DeviceModelInternal.T3T1 }),
            },
        };

        expect(selectDeviceModelWithFlagshipFallback(state)).toBe(DeviceModelInternal.T3T1);
    });

    it('returns the flagship model when the model of the selected device cannot be read', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: mockSuiteDevice(
                    {},
                    { internal_model: DeviceModelInternal.UNKNOWN },
                ),
            },
        };

        expect(selectDeviceModelWithFlagshipFallback(state)).toBe(DEFAULT_FLAGSHIP_MODEL);
    });

    it('returns the flagship model when no device is selected', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: undefined,
            },
        };

        expect(selectDeviceModelWithFlagshipFallback(state)).toBe(DEFAULT_FLAGSHIP_MODEL);
    });
});

describe(selectStandardWalletByDeviceId.name, () => {
    it('selects the standard wallet', () => {
        expect(selectStandardWalletByDeviceId(createState([standardWallet]), 'device-1')).toBe(
            standardWallet,
        );
    });

    it('selects the standard wallet when a hidden wallet of the device is listed first', () => {
        expect(
            selectStandardWalletByDeviceId(createState([hiddenWallet, standardWallet]), 'device-1'),
        ).toBe(standardWallet);
    });

    it('never selects a hidden wallet', () => {
        expect(selectStandardWalletByDeviceId(createState([hiddenWallet]), 'device-1')).toBeNull();
    });

    it('ignores a standard wallet without state', () => {
        expect(
            selectStandardWalletByDeviceId(
                createState([createWallet({ state: undefined })]),
                'device-1',
            ),
        ).toBeNull();
    });

    it('ignores standard wallets of other devices', () => {
        expect(
            selectStandardWalletByDeviceId(
                createState([createWallet({ id: 'device-2' })]),
                'device-1',
            ),
        ).toBeNull();
    });
});

describe(selectStandardWalletDescriptorByDeviceId.name, () => {
    it('returns the descriptor of the standard wallet', () => {
        expect(
            selectStandardWalletDescriptorByDeviceId(
                createState([hiddenWallet, standardWallet]),
                'device-1',
            ),
        ).toBe('standard');
    });

    it('returns null without a standard wallet', () => {
        expect(
            selectStandardWalletDescriptorByDeviceId(createState([hiddenWallet]), 'device-1'),
        ).toBeNull();
    });
});

describe('selectAccountSigningDevice', () => {
    const ownerState = 'test@owner:0';
    const owner = mockSuiteDevice({
        connected: true,
        available: true,
        path: 'usb-a',
        state: { staticSessionId: ownerState },
    });
    const selected = (device?: typeof owner) => ({
        device: { ...deviceReducerInitialState, selectedDevice: device },
    });

    it('uses the latest session for the verified wallet and device path', () => {
        const current = mockSuiteDevice({
            connected: true,
            available: true,
            path: 'usb-a',
            instance: 1,
            state: { staticSessionId: ownerState },
        });
        expect(selectAccountSigningDevice(selected(current), ownerState, owner.path)).toBe(current);
    });

    it.each([
        undefined,
        { ...owner, connected: false },
        { ...owner, available: false },
        mockSuiteDevice({
            connected: true,
            available: true,
            path: 'usb-b',
            state: { staticSessionId: ownerState },
        }),
        mockSuiteDevice({
            connected: true,
            available: true,
            path: 'usb-a',
            state: { staticSessionId: 'test@other:0' },
        }),
    ])('rejects a missing connection or a different wallet after composition', current => {
        expect(
            selectAccountSigningDevice(selected(current), ownerState, owner.path),
        ).toBeUndefined();
    });
});
