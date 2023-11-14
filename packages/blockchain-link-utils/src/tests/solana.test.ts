import {
    getTokenNameAndSymbol,
    transformTokenInfo,
    ApiTokenAccount,
} from '../solana';
import { fixtures } from './fixtures/solana';

describe('solana/utils', () => {
    // Token Utils
    describe('getTokenNameAndSymbol', () => {
        fixtures.getTokenNameAndSymbol.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                expect(getTokenNameAndSymbol(input.mint, input.map)).toEqual(expectedOutput);
            });
        });
    });

    describe('transformTokenInfo', () => {
        fixtures.transformTokenInfo.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                expect(
                    transformTokenInfo(input.accountInfo as ApiTokenAccount[], input.map),
                ).toEqual(expectedOutput);
            });
        });
    });
});
