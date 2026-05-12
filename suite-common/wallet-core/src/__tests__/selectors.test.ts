import { type TrezorDevice } from '@suite-common/suite-types';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { type DeviceUniquePath, type StaticSessionId } from '@trezor/connect';

import { selectShouldRediscover } from '../selectors';

const TEST_PATH = 'device-id:1' as DeviceUniquePath;
const TEST_STATIC_SESSION_ID = 'static-session-1' as StaticSessionId;

const mockDevice = (overrides: Partial<TrezorDevice> = {}): TrezorDevice =>
    ({
        id: 'device-1',
        type: 'acquired',
        connected: true,
        path: TEST_PATH,
        features: { capabilities: [] },
        unavailableCapabilities: {},
        state: { staticSessionId: TEST_STATIC_SESSION_ID },
        discovered: true,
        ...overrides,
    }) as unknown as TrezorDevice;

const createState = (overrides: { discovery?: DiscoveryStatus; enabledNetworks?: string[] }) =>
    ({
        device: {
            devices: [],
            persistentDeviceData: [],
            selectedDevice: mockDevice(),
        },
        wallet: {
            accounts: [],
            discovery: overrides.discovery ? { [TEST_PATH]: overrides.discovery } : {},
            settings: {
                enabledNetworks: overrides.enabledNetworks ?? [],
            },
            blockchain: {},
        },
    }) as any;

describe('selectShouldRediscover', () => {
    it('returns false when discovery is currently running', () => {
        const state = createState({ discovery: { status: 'starting' } });
        const device = mockDevice();

        expect(selectShouldRediscover(state, device)).toBe(false);
    });

    it('returns true when there is no staticSessionId on the device', () => {
        const state = createState({});
        const device = mockDevice({ state: undefined });

        expect(selectShouldRediscover(state, device)).toBe(true);
    });

    it('returns true when the device has not been discovered yet', () => {
        const state = createState({});
        const device = mockDevice({ discovered: false });

        expect(selectShouldRediscover(state, device)).toBe(true);
    });

    it('returns false when discovered device has no enabled networks left to discover', () => {
        const state = createState({ enabledNetworks: [] });
        const device = mockDevice();

        expect(selectShouldRediscover(state, device)).toBe(false);
    });

    it('returns the same primitive across repeated calls with unchanged state', () => {
        const state = createState({});
        const device = mockDevice();

        expect(selectShouldRediscover(state, device)).toBe(selectShouldRediscover(state, device));
    });
});
