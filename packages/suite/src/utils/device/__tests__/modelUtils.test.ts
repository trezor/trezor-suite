import { DeviceModelInternal } from '@trezor/protobuf';

import { pickByDeviceModel } from '../modelUtils';

const OPTIONS = {
    default: 'default',
    [DeviceModelInternal.T1B1]: null,
    [DeviceModelInternal.T3T1]: 'T3T1',
};

const fixtures = [
    {
        description: 'should return correct value for a given device',
        deviceModelInternal: DeviceModelInternal.T3T1,
        expectedResult: 'T3T1',
    },
    {
        description: 'should return null when the value for the picked device is null',
        deviceModelInternal: DeviceModelInternal.T1B1,
        expectedResult: null,
    },
    {
        description: 'should return default when deviceModelInternal is undefined',
        deviceModelInternal: undefined,
        expectedResult: 'default',
    },
    {
        description: 'should return default when deviceModelInternal is not among options',
        deviceModelInternal: DeviceModelInternal.T2B1,
        expectedResult: 'default',
    },
];

describe('pickByDeviceModel', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            expect(pickByDeviceModel(f.deviceModelInternal, OPTIONS)).toBe(f.expectedResult);
        });
    });
});
