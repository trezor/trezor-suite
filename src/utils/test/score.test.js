import { mockRandom } from 'jest-mock-random';
import { isInProbability, getScore } from 'utils/score';

describe('Score Utils', () => {
    it('should not be in probability with higher score', () => {
        const result = isInProbability(0.21, 0.30);
        expect(result).toBe(false);
    });

    it('should be in probability with lower score', () => {
        const result = isInProbability(0.21, 0.10);
        expect(result).toBe(true);
    });

    it('should be in probability if score is equal', () => {
        const result = isInProbability(0.51, 0.51);
        expect(result).toBe(true);
    });

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
