import { selectTickerFromAccounts } from '../fiatRatesSelectors';

type AnyState = Parameters<typeof selectTickerFromAccounts>[0];

const buildState = ({
    accounts,
    tokenDefinitions,
    deviceState,
}: {
    accounts: any[];
    tokenDefinitions?: any;
    deviceState?: string;
}): AnyState =>
    ({
        wallet: {
            accounts,
            fiat: {},
        },
        tokenDefinitions: tokenDefinitions ?? {},
        device: {
            selectedDevice: {
                state: { staticSessionId: deviceState ?? 'device-1' },
            },
        },
    }) as unknown as AnyState;

describe('selectTickerFromAccounts', () => {
    it('returns the same TickerId[] reference across repeated calls when inputs are unchanged', () => {
        const accounts = [
            {
                key: 'a1',
                symbol: 'eth',
                deviceState: 'device-1',
                tokens: [],
            },
        ];
        const state = buildState({ accounts });

        const first = selectTickerFromAccounts(state);
        const second = selectTickerFromAccounts(state);

        expect(second).toBe(first);
    });

    it('filters out tokens with zero balance and dedupes by symbol+tokenAddress', () => {
        const accounts = [
            {
                key: 'a1',
                symbol: 'eth',
                deviceState: 'device-1',
                tokens: [
                    {
                        contract: '0xAAA',
                        balance: '10',
                        protocols: [],
                    },
                    {
                        contract: '0xBBB',
                        balance: '0',
                        protocols: [],
                    },
                ],
            },
            {
                key: 'a2',
                symbol: 'eth',
                deviceState: 'device-1',
                tokens: [
                    {
                        contract: '0xAAA',
                        balance: '5',
                        protocols: [],
                    },
                ],
            },
        ];
        const tokenDefinitions = {
            eth: { coin: { data: ['0xaaa'] } },
        };
        const state = buildState({ accounts, tokenDefinitions });

        const result = selectTickerFromAccounts(state);

        expect(result).toEqual([
            { symbol: 'eth' },
            { symbol: 'eth', tokenAddress: '0xAAA', protocols: [] },
        ]);
    });

    it('invalidates the cache when tokenDefinitions slice reference changes', () => {
        const accounts = [
            {
                key: 'a1',
                symbol: 'eth',
                deviceState: 'device-1',
                tokens: [
                    {
                        contract: '0xAAA',
                        balance: '10',
                        protocols: [],
                    },
                ],
            },
        ];
        const stateA = buildState({ accounts, tokenDefinitions: {} });
        const stateB = buildState({
            accounts,
            tokenDefinitions: { eth: { coin: { data: ['0xaaa'] } } },
        });

        const first = selectTickerFromAccounts(stateA);
        const second = selectTickerFromAccounts(stateB);

        expect(second).not.toBe(first);
        expect(first).toEqual([{ symbol: 'eth' }]);
        expect(second).toEqual([
            { symbol: 'eth' },
            { symbol: 'eth', tokenAddress: '0xAAA', protocols: [] },
        ]);
    });
});
