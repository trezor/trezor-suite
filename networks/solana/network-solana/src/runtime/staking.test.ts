import { getSolanaValidatorFixtures } from './__fixtures__/staking.fixture';
import { selectSolanaValidator } from './staking';

describe('selectSolanaValidator', () => {
    getSolanaValidatorFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const result = selectSolanaValidator(fixture.symbol);
            expect(result).toBe(fixture.result);
        });
    });
});
