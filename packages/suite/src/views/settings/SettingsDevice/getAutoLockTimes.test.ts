import { getAutoLockTimes } from './getAutoLockTimes';

const PRESET_AUTO_LOCK_TIMES = [30, 60, 600] as const;

describe('getAutoLockTimes', () => {
    it('returns the presets when the device holds one of them', () => {
        expect(
            getAutoLockTimes({
                presetAutoLockTimes: PRESET_AUTO_LOCK_TIMES,
                autoLockDelay: 60_000,
            }),
        ).toEqual([30, 60, 600]);
    });

    it('adds a delay that is not among the presets in ascending order', () => {
        expect(
            getAutoLockTimes({
                presetAutoLockTimes: PRESET_AUTO_LOCK_TIMES,
                autoLockDelay: 40_000,
            }),
        ).toEqual([30, 40, 60, 600]);
    });

    it('adds a delay outside the preset range', () => {
        expect(
            getAutoLockTimes({
                presetAutoLockTimes: PRESET_AUTO_LOCK_TIMES,
                autoLockDelay: 10_000,
            }),
        ).toEqual([10, 30, 60, 600]);
        expect(
            getAutoLockTimes({
                presetAutoLockTimes: PRESET_AUTO_LOCK_TIMES,
                autoLockDelay: 3_600_000,
            }),
        ).toEqual([30, 60, 600, 3600]);
    });

    it('does not modify the presets', () => {
        getAutoLockTimes({ presetAutoLockTimes: PRESET_AUTO_LOCK_TIMES, autoLockDelay: 40_000 });

        expect(PRESET_AUTO_LOCK_TIMES).toEqual([30, 60, 600]);
    });
});
