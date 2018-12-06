import { mockRandom } from 'jest-mock-random';
import { getScore } from 'main';

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
});
