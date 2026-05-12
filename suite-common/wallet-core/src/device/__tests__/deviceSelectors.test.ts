import { type DeviceRootState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';

import { selectSelectedFirstThpDevice } from '../deviceSelectors';

type AnyDevice = Partial<TrezorDevice> & { id?: string };

const mockDevice = (overrides: AnyDevice = {}): TrezorDevice =>
    ({
        id: 'device-1',
        type: 'acquired',
        connected: true,
        features: {},
        ...overrides,
    }) as unknown as TrezorDevice;

const createState = (devices: TrezorDevice[]): DeviceRootState =>
    ({
        device: {
            devices,
            persistentDeviceData: [],
        },
    }) as unknown as DeviceRootState;

describe('selectSelectedFirstThpDevice', () => {
    it('returns the same device reference across calls when state is unchanged', () => {
        const thpDevice = mockDevice({ id: 'thp', thp: { properties: {} } as any });
        const state = createState([mockDevice(), thpDevice]);

        const first = selectSelectedFirstThpDevice(state);
        const second = selectSelectedFirstThpDevice(state);

        expect(second).toBe(first);
        expect(first).toBe(thpDevice);
    });

    it('returns the same undefined reference across calls when no THP device exists', () => {
        const stateA = createState([mockDevice({ id: 'a' }), mockDevice({ id: 'b' })]);
        const stateB = createState([mockDevice({ id: 'a' }), mockDevice({ id: 'b' })]);

        // identical undefined results across separate states (primitive ===)
        expect(selectSelectedFirstThpDevice(stateA)).toBeUndefined();
        expect(selectSelectedFirstThpDevice(stateB)).toBeUndefined();
    });

    it('prefers an unacquired thp-locked device over an acquired thp device', () => {
        const acquiredThp = mockDevice({ id: 'acquired-thp', thp: { properties: {} } as any });
        const lockedThp = mockDevice({
            id: 'locked-thp',
            status: 'thp-locked' as any,
            thp: { properties: {} } as any,
        });
        const state = createState([acquiredThp, lockedThp]);

        expect(selectSelectedFirstThpDevice(state)).toBe(lockedThp);
    });

    it('invalidates the cache when devices array reference changes', () => {
        const thpDeviceA = mockDevice({ id: 'thp-a', thp: { properties: {} } as any });
        const thpDeviceB = mockDevice({ id: 'thp-b', thp: { properties: {} } as any });

        const stateA = createState([thpDeviceA]);
        const stateB = createState([thpDeviceB]);

        expect(selectSelectedFirstThpDevice(stateA)).toBe(thpDeviceA);
        expect(selectSelectedFirstThpDevice(stateB)).toBe(thpDeviceB);
    });
});
