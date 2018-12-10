import { findNextBootloader } from 'utils/list';

describe('List Utils', () => {
    describe('next bootloader', () => {
        it('it should return next version from bottom', () => {
            const releasesList = [
                { version: [5, 0, 0], min_bootloader_version: [5, 0, 0] },
                { version: [4, 0, 0], min_bootloader_version: [4, 0, 0] },
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ];
            const result = findNextBootloader(releasesList, [2, 0, 0]);
            expect(result.version).toEqual([3, 0, 0]);
        });

        it('it should return next version from top', () => {
            const releasesList = [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ];
            const result = findNextBootloader(releasesList, [2, 0, 0]);
            expect(result.version).toEqual([3, 0, 0]);
        });
    });
});
