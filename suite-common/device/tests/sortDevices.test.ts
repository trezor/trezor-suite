import type { TrezorDevice } from '@suite-common/suite-types';

import { PORTFOLIO_TRACKER_DEVICE_ID, portfolioTrackerDevice } from '../src/deviceConstants';
import { sortDevices } from '../src/sortDevices';

describe(sortDevices.name, () => {
    const baseAcquired: TrezorDevice = {
        ...portfolioTrackerDevice,
        type: 'acquired',
    } as TrezorDevice;

    const createTestDevice = (id: string, ts: number): TrezorDevice =>
        ({
            ...baseAcquired,
            id,
            ts,
        }) as TrezorDevice;

    it('sorts by timestamp desc when no portfolio tracker devices are present', () => {
        const input = [
            createTestDevice('a', 1),
            createTestDevice('b', 3),
            createTestDevice('c', 2),
        ];

        const result = sortDevices(input);

        expect(result.map(d => d.id)).toEqual(['b', 'c', 'a']);
    });

    it('moves portfolio tracker devices to the end while preserving timestamp order', () => {
        const pt = PORTFOLIO_TRACKER_DEVICE_ID;
        const input = [
            createTestDevice('x', 4),
            createTestDevice(pt, 10),
            createTestDevice('y', 3),
            createTestDevice(pt, 2),
            createTestDevice('z', 8),
        ];

        const result = sortDevices(input);

        expect(result.slice(0, 3).map(d => d.id)).toEqual(['z', 'x', 'y']);
        expect(result.slice(3).map(d => d.id)).toEqual([pt, pt]);
        expect(result.slice(3).map(d => d.ts)).toEqual([10, 2]);
    });

    it('does not mutate the input array', () => {
        const input = [
            createTestDevice('a', 1),
            createTestDevice(PORTFOLIO_TRACKER_DEVICE_ID, 5),
            createTestDevice('b', 3),
        ];
        const original = [...input];

        void sortDevices(input);

        expect(input).toEqual(original);
    });
});
