import { getSolanaValidatorFixtures } from './api.fixture';
import { selectSolanaValidator } from '../src/runtime/api';

describe('selectSolanaValidator', () => {
    getSolanaValidatorFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const result = selectSolanaValidator(fixture?.symbol as unknown as 'sol' | 'dsol');
            expect(result).toBe(fixture.result);
        });
    });
});
