import type { Network } from '@connect-coins/solana/constants';

import { getSolanaValidatorFixtures } from '../__fixtures__/connection';
import { getSolanaValidator } from '../connection';

describe('getSolanaValidator', () => {
    getSolanaValidatorFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const result = getSolanaValidator(fixture?.network as unknown as Network);
            expect(result).toBe(fixture.result);
        });
    });
});
