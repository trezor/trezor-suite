import { default as GetAccountInfo } from './getAccountInfo';

const DESCRIPTOR = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
const CONTRACT = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';

// The constructor is where parameters are validated, so it is enough on its own — no device and
// no backend are involved.
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
    // Regression: the parameter was declared without `allowEmpty`, so an account watching no
    // contract tokens — the default for every account until the user adds one — failed validation
    // with `Parameter "stellarContractTokens" is empty.` before any request was made. Suite passes
    // the watch list on every account refresh, so Stellar accounts never refreshed at all.
    it('accepts an empty watch list', () => {
        expect(() => createMethod([])).not.toThrow();
    });

    it('accepts a populated watch list', () => {
        expect(() => createMethod([CONTRACT])).not.toThrow();
    });

    it('accepts an omitted watch list', () => {
        expect(() => createMethod()).not.toThrow();
    });
});
