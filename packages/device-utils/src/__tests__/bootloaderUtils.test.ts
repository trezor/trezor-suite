import {
    T1B1Features,
    T1B1FeaturesBL,
    T2T1Features,
    T2T1FeaturesBL,
} from '../__fixtures__/deviceFeatures';
import { getBootloaderVersion, getBootloaderVersionArray } from '../bootloaderUtils';
import { type PartialDevice } from '../types';

describe('bootloaderUtils', () => {
    describe(getBootloaderVersionArray.name, () => {
        it('returns empty on missing data', () => {
            expect(getBootloaderVersionArray({})).toBeNull();
            expect(
                getBootloaderVersionArray({ features: { bootloader_mode: true } } as PartialDevice),
            ).toBeNull();
        });
        it('returns null for normal mode devices', () => {
            expect(getBootloaderVersionArray({ features: T1B1Features })).toBeNull();
            expect(getBootloaderVersionArray({ features: T2T1Features })).toBeNull();
        });
        it('returns correct version array for bootloader devices', () => {
            expect(getBootloaderVersionArray({ features: T1B1FeaturesBL })).toEqual([1, 12, 1]);
            expect(getBootloaderVersionArray({ features: T2T1FeaturesBL })).toEqual([2, 1, 8]);
        });
    });

    describe(getBootloaderVersion.name, () => {
        it('returns empty string on missing data', () => {
            expect(getBootloaderVersion({})).toBe('');
            expect(
                getBootloaderVersion({ features: { bootloader_mode: true } } as PartialDevice),
            ).toBe('');
        });
        it('returns empty string for normal mode devices', () => {
            expect(getBootloaderVersion({ features: T1B1Features })).toBe('');
            expect(getBootloaderVersion({ features: T2T1Features })).toBe('');
        });
        it('returns correct version for bootloader devices', () => {
            expect(getBootloaderVersion({ features: T1B1FeaturesBL })).toEqual('1.12.1');
            expect(getBootloaderVersion({ features: T2T1FeaturesBL })).toEqual('2.1.8');
        });
    });
});
