import { mockRandom } from 'jest-mock-random';
import { isInProbability, getScore } from 'utils/score';

describe('Score Utils', () => {
    describe('isInProbability()', () => {
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

        it('should fail without score param', () => {
            expect(() => {
                isInProbability(0);
            }).toThrow('score not supplied. If you want to override this functionality, just pass 0');
        });

        it('should fail with score param null', () => {
            expect(() => {
                isInProbability(0, null);
            }).toThrow('score not supplied. If you want to override this functionality, just pass 0');
        });

        it('should not fail with score param 0', () => {
            expect(() => {
                isInProbability(0, 0);
            }).not.toThrow('score not supplied. If you want to override this functionality, just pass 0');
        });
    });

    describe('getScore()', () => {
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
});
