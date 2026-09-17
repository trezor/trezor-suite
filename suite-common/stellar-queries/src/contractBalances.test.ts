import { stellarContractBalancesQuery } from './contractBalances';

const HOLDER = 'GA_HOLDER';
const URL = 'https://stellar.example';

const CURATED = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV'; // deJTRSY, 18 decimals
const UNDEFINED_DECIMALS = 'CDUNKNOWN000000000000000000000000000000000000000000000001';
const CLASSIC_SAC = 'CSAC00000000000000000000000000000000000000000000000000001';

const readSep41Tokens = jest.fn();
const computeSorobanAssetContractId = jest.fn(() => ({ sorobanAssetContractId: CLASSIC_SAC }));

jest.mock('@trezor/network-stellar/runtime', () => ({
    __esModule: true,
    default: () =>
        Promise.resolve({
            readSep41Tokens,
            computeSorobanAssetContractId,
            // Every id in this file that is not a classic `CODE-ISSUER` key is a contract id.
            isValidContractId: (value: string) => value.startsWith('C'),
        }),
}));

jest.mock('./connection', () => ({
    getStellarConnection: () => Promise.resolve({ rpc: 'rpc', passphrase: 'passphrase' }),
}));

const run = (params: Partial<Parameters<typeof stellarContractBalancesQuery.options>[0]> = {}) =>
    stellarContractBalancesQuery.options({
        url: URL,
        descriptor: HOLDER,
        contracts: [CURATED],
        classicContracts: [],
        watched: [],
        ...params,
    }).queryFn!({} as never);

beforeEach(() => {
    readSep41Tokens.mockReset();
    computeSorobanAssetContractId.mockClear();
});

describe('stellarContractBalancesQuery', () => {
    it('reports a held token in whole units, not in the base subunits the network answers with', async () => {
        readSep41Tokens.mockResolvedValue([
            { contract: CURATED, balance: '1500000000000000000', decimals: 18, symbol: 'deJTRSY' },
        ]);

        await expect(run()).resolves.toEqual([
            expect.objectContaining({ contract: CURATED, balance: '1.5' }),
        ]);
    });

    it('hides a curated token the account does not hold, but keeps a watched one at zero', async () => {
        readSep41Tokens.mockResolvedValue([
            { contract: CURATED, balance: '0', decimals: 18, symbol: 'deJTRSY' },
        ]);

        await expect(run()).resolves.toEqual([]);
        await expect(run({ watched: [CURATED] })).resolves.toEqual([
            expect.objectContaining({ contract: CURATED, balance: '0' }),
        ]);
    });

    it('drops a token whose decimals nothing can supply, rather than guessing at them', async () => {
        readSep41Tokens.mockResolvedValue([
            { contract: UNDEFINED_DECIMALS, balance: '1', decimals: undefined },
        ]);

        await expect(run({ contracts: [UNDEFINED_DECIMALS] })).resolves.toEqual([]);
    });

    it('falls back to the definitions for a contract that does not describe itself', async () => {
        readSep41Tokens.mockResolvedValue([
            { contract: UNDEFINED_DECIMALS, balance: '100', decimals: undefined },
        ]);

        await expect(
            run({
                contracts: [UNDEFINED_DECIMALS],
                fallbacks: {
                    [UNDEFINED_DECIMALS]: { name: 'Fallback', symbol: 'fb', decimals: 2 },
                },
            }),
        ).resolves.toEqual([
            expect.objectContaining({ name: 'Fallback', symbol: 'FB', balance: '1' }),
        ]);
    });

    it('never asks for the contract wrapping a classic trustline, which is reported as that trustline', async () => {
        readSep41Tokens.mockResolvedValue([]);

        await expect(
            run({ contracts: [CLASSIC_SAC, CURATED], classicContracts: ['USDC-GA1'] }),
        ).resolves.toEqual([]);
        expect(readSep41Tokens).toHaveBeenCalledWith('rpc', HOLDER, [CURATED], 'passphrase');
    });

    it('asks for nothing when the whole list is already covered by trustlines', async () => {
        await expect(
            run({ contracts: [CLASSIC_SAC], classicContracts: ['USDC-GA1'] }),
        ).resolves.toEqual([]);
        expect(readSep41Tokens).not.toHaveBeenCalled();
    });
});
