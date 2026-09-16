import { default as GetAccountInfo } from './getAccountInfo';

const DESCRIPTOR = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
const CONTRACT = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';

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

describe(GetAccountInfo.name, () => {
    // Without `allowEmpty` an account watching nothing failed validation and never refreshed.
    it('accepts an empty watch list', () => {
        expect(() => createMethod([])).not.toThrow();
    });

    it('accepts a populated watch list', () => {
        const method = createMethod([CONTRACT]);

        // `params` is protected; element access is how a test may read it.
        expect(method['params'][0]!.stellarContractTokens).toEqual([CONTRACT]);
    });

    it('accepts an omitted watch list', () => {
        expect(() => createMethod()).not.toThrow();
    });
});
