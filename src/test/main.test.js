import { mockRandom } from 'jest-mock-random';
import { getScore, getLatestSafeFw } from 'main';

describe('Get fixed random', () => {
    it('test random case 0.907862123418226', () => {
        mockRandom(0.907862123418226);
        const score = getScore();
        expect(score).toBe('0.91');
    });

    it('test random case 0.512862123418226', () => {
        mockRandom(0.512862123418226);
        const score = getScore();
        expect(score).toBe('0.51');
    });

    it('no firmware at all', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ],
            isInBootloader: false,
            firmwareVersion: null,
        });

        expect(result.version).toEqual([3, 0, 0]);
    });

    it('empty case', () => {
        const result = getLatestSafeFw({
            releasesList: [
                { version: [3, 0, 0], min_bootloader_version: [3, 0, 0] },
                { version: [2, 0, 0], min_bootloader_version: [2, 0, 0] },
                { version: [1, 0, 0], min_bootloader_version: [1, 0, 0] },
            ],
        });

        expect(result.version).toEqual([3, 0, 0]);
    });
});
