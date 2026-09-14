import { default as GetAccountInfo } from './getAccountInfo';

const DESCRIPTOR = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
const CONTRACT = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';

// The constructor is where parameters are validated, so no device or backend is involved.
const createMethod = (stellarContractTokens?: string[]) =>
    new GetAccountInfo({
        payload: {
            method: 'getAccountInfo',
            coin: 'xlm',
            descriptor: DESCRIPTOR,
            details: 'basic',
            ...(stellarContractTokens ? { stellarContractTokens } : {}),
        },
    });

describe('GetAccountInfo stellarContractTokens', () => {
    // Regression: declared without `allowEmpty`, the parameter failed validation for an account
    // watching no contract tokens — which is every account until the user adds one, so Stellar
    // accounts never refreshed at all.
    it('accepts an empty watch list', () => {
        expect(() => createMethod([])).not.toThrow();
    });

    // Asserted on the parsed value, not just on not throwing: dropping the parameter from the
    // validated params altogether would satisfy `not.toThrow()` and still refresh every Stellar
    // account with no contract tokens.
    it('accepts a populated watch list', () => {
        const method = createMethod([CONTRACT]);

        // `params` is protected; element access is how TypeScript lets a test read one.
        expect(method['params'][0]!.stellarContractTokens).toEqual([CONTRACT]);
    });

    it('accepts an omitted watch list', () => {
        expect(() => createMethod()).not.toThrow();
    });
});
