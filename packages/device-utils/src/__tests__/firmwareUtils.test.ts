import {
    T1B1Features,
    T1B1FeaturesBL,
    T2T1Features,
    T2T1FeaturesBL,
} from '../__fixtures__/deviceFeatures';
import { getFirmwareOrBootloaderVersionArray } from '../firmwareUtils';


describe('firmwareUtils', () => {
    describe(getFirmwareOrBootloaderVersionArray.name, () => {
        it('returns correct version array for normal mode devices', () => {
            expect(getFirmwareOrBootloaderVersionArray(T1B1Features)).toEqual([1, 13, 1]);
            expect(getFirmwareOrBootloaderVersionArray(T2T1Features)).toEqual([2, 9, 4]);
        });
        it('returns correct version array for bootloader devices', () => {
            expect(getFirmwareOrBootloaderVersionArray(T1B1FeaturesBL)).toEqual([1, 12, 1]);
            expect(getFirmwareOrBootloaderVersionArray(T2T1FeaturesBL)).toEqual([2, 1, 8]);
        });
    });
});
