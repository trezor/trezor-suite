import {
    T1B1Features,
    T1B1FeaturesBL,
    T2T1Features,
    T2T1FeaturesBL,
} from '../__fixtures__/deviceFeatures';
import {
    getFirmwareOrBootloaderVersionArray,
    getFirmwareVersion,
    getFirmwareVersionArray,
} from '../firmwareUtils';
import { type PartialDevice } from '../types';

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

    describe(getFirmwareVersionArray.name, () => {
        it('returns null on missing data', () => {
            expect(getFirmwareVersionArray({})).toBeNull();
            expect(
                getFirmwareVersionArray({ features: { bootloader_mode: true } } as PartialDevice),
            ).toBeNull();
        });
        it('returns correct version array for normal mode devices', () => {
            expect(getFirmwareVersionArray({ features: T1B1Features })).toEqual([1, 13, 1]);
            expect(getFirmwareVersionArray({ features: T2T1Features })).toEqual([2, 9, 4]);
        });
        it('returns correct version array for bootloader devices', () => {
            expect(getFirmwareVersionArray({ features: T1B1FeaturesBL })).toEqual([1, 13, 1]);
            expect(getFirmwareVersionArray({ features: T2T1FeaturesBL })).toEqual([2, 9, 4]);
        });
    });

    describe(getFirmwareVersion.name, () => {
        it('returns empty string on missing data', () => {
            expect(getFirmwareVersion({})).toBe('');
            expect(
                getFirmwareVersion({ features: { bootloader_mode: true } } as PartialDevice),
            ).toBe('');
        });
        it('returns correct version for normal mode devices', () => {
            expect(getFirmwareVersion({ features: T1B1Features })).toEqual('1.13.1');
            expect(getFirmwareVersion({ features: T2T1Features })).toEqual('2.9.4');
        });
        it('returns correct version for bootloader devices', () => {
            expect(getFirmwareVersion({ features: T1B1FeaturesBL })).toEqual('1.13.1');
            expect(getFirmwareVersion({ features: T2T1FeaturesBL })).toEqual('2.9.4');
        });
    });
});
