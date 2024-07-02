import { OPTIONS, fixtures } from './__fixtures__/modelUtils';
import { pickByDeviceModel } from '../src';

describe('pickByDeviceModel', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            expect(pickByDeviceModel(f.deviceModelInternal, OPTIONS)).toBe(f.expectedResult);
        });
    });
});
