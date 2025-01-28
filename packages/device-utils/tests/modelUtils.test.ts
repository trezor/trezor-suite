import { pickByDeviceModel } from '../src';
import { OPTIONS, fixtures } from './__fixtures__/modelUtils';

describe('pickByDeviceModel', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            expect(pickByDeviceModel(f.deviceModelInternal, OPTIONS)).toBe(f.expectedResult);
        });
    });
});
