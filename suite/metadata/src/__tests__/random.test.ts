import { getCodeChallenge } from '../random';

describe('random', () => {
    describe('getCodeChallenge', () => {
        it('returns a 128-character alphanumeric string', () => {
            expect(getCodeChallenge()).toMatch(/^[0-9a-zA-Z]{128}$/);
        });

        it('produces distinct values on successive calls', () => {
            const samples = new Set(Array.from({ length: 50 }, () => getCodeChallenge()));
            expect(samples.size).toBe(50);
        });
    });
});
