import { DeviceModelInternal } from '@trezor/device-utils';

import { parseModelEnumFromBytes } from '../src';

describe(parseModelEnumFromBytes.name, () => {
    it('parses invalid data as UNKNOWN', () => {
        expect(parseModelEnumFromBytes([])).toBe(DeviceModelInternal.UNKNOWN);
    });

    it('parses invalid model as UNKNOWN', () => {
        expect(parseModelEnumFromBytes([1, 0, 3, 4, 5, 6, 7])).toBe(DeviceModelInternal.UNKNOWN);
    });

    it('parses correctly T3W1', () => {
        expect(parseModelEnumFromBytes([1, 0, 84, 51, 87, 49])).toBe(DeviceModelInternal.T3W1);
    });
});
