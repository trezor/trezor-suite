import { getCodeChallenge } from '../random';

describe('random', () => {
    describe('getCodeChallenge', () => {
        it('should match regexp [0-9a-zA-Z-._~], {43,128}', () => {
            expect(getCodeChallenge()).toMatch(/[0-9a-zA-Z\-._~]{128}/);
        });
    });
});
