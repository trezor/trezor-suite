import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type AssetFirstTableState,
    getAssetFirstTotals,
    selectAssetFirstRows,
} from './assetFirstTableSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;
const BOB = 'bobWallet@device:1' as StaticSessionId;

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');
const POL = asNetworkSymbol('pol');
const DSOL = asNetworkSymbol('dsol');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const USDC_ON_POL = '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' as TokenAddress;
const UNKNOWN_TOKEN = '0x0000000000000000000000000000000000000bad' as TokenAddress;

type MockAccountParams = {
    deviceState?: StaticSessionId;
    symbol?: Account['symbol'];
    index?: number;
    balance?: string;
    isVisible?: boolean;
    tokens?: { contract: TokenAddress; balance: string; symbol?: string }[];
};

const mockAccount = ({
    deviceState = ALICE,
    symbol = ETH,
    index = 0,
    balance = '1',
    isVisible = true,
    tokens = [],
}: MockAccountParams = {}): Account =>
    ({
        key: `descriptor${index}-${symbol}-${deviceState}`,
        deviceState,
        symbol,
        index,
        accountType: 'normal',
        formattedBalance: balance,
        visible: isVisible,
        tokens,
    }) as unknown as Account;

const mockRate = (symbol: Account['symbol'], rate: number, contract?: TokenAddress) => ({
    [getFiatRateKey(symbol, 'usd', contract)]: { rate },
});

type MockStateParams = {
    accounts: Account[];
    enabledNetworks?: Account['symbol'][];
    rates?: Record<string, { rate: number }>;
    knownTokens?: TokenAddress[];
    hiddenTokens?: TokenAddress[];
    shownTokens?: TokenAddress[];
};

const createState = ({
    accounts,
    enabledNetworks = [BTC, ETH, POL],
    rates = {},
    knownTokens = [USDC_ON_ETH, USDC_ON_POL],
    hiddenTokens = [],
    shownTokens = [],
}: MockStateParams): AssetFirstTableState => {
    const definitions = {
        coin: { data: knownTokens, hide: hiddenTokens, show: shownTokens },
    };

    return {
        device: { selectedDevice: { state: { staticSessionId: ALICE } } },
        wallet: {
            accounts,
            settings: { enabledNetworks, localCurrency: 'usd' },
            fiat: { current: rates, lastWeek: {}, historic: {} },
        },
        tokenDefinitions: { [ETH]: definitions, [POL]: definitions, [DSOL]: definitions },
    } as unknown as AssetFirstTableState;
};

const selectAssetFirstRowKeys = (state: AssetFirstTableState) =>
    selectAssetFirstRows(state, ALICE).map(row => row.assetKey);

describe('the rows the table is given', () => {
    it('lists one key per asset and network', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: ETH,
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_ETH, balance: '10' }],
                }),
                mockAccount({ symbol: BTC, index: 1 }),
            ],
        });

        expect(selectAssetFirstRowKeys(state)).toEqual(
            expect.arrayContaining([
                `${ALICE}/eth/`,
                `${ALICE}/eth/${USDC_ON_ETH}`,
                `${ALICE}/btc/`,
            ]),
        );
    });

    it('puts the most valuable holding first, each network on its own', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: ETH,
                    balance: '2',
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_ETH, balance: '2400' }],
                }),
                mockAccount({
                    symbol: POL,
                    index: 1,
                    balance: '10',
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_POL, balance: '720' }],
                }),
            ],
            rates: {
                ...mockRate(ETH, 3000),
                ...mockRate(POL, 0.5),
                ...mockRate(ETH, 1, USDC_ON_ETH),
                ...mockRate(POL, 1, USDC_ON_POL),
            },
        });

        expect(selectAssetFirstRowKeys(state)).toEqual([
            `${ALICE}/eth/`,
            `${ALICE}/eth/${USDC_ON_ETH}`,
            `${ALICE}/pol/${USDC_ON_POL}`,
            `${ALICE}/pol/`,
        ]);
    });

    it('ranks a small holding by its own value, not by what the asset is worth in total', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: ETH,
                    balance: '1',
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_ETH, balance: '5000' }],
                }),
                mockAccount({
                    symbol: POL,
                    index: 1,
                    balance: '0',
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_POL, balance: '1' }],
                }),
            ],
            rates: {
                ...mockRate(ETH, 2000),
                ...mockRate(POL, 0.5),
                ...mockRate(ETH, 1, USDC_ON_ETH),
                ...mockRate(POL, 1, USDC_ON_POL),
            },
        });

        expect(selectAssetFirstRowKeys(state)).toEqual([
            `${ALICE}/eth/${USDC_ON_ETH}`,
            `${ALICE}/eth/`,
            `${ALICE}/pol/${USDC_ON_POL}`,
            `${ALICE}/pol/`,
        ]);
    });

    it('settles holdings worth the same by asset and network', () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: POL, balance: '2' }),
                mockAccount({ symbol: ETH, index: 1, balance: '2' }),
                mockAccount({ symbol: BTC, index: 2, balance: '2' }),
            ],
            rates: { ...mockRate(ETH, 1), ...mockRate(POL, 1), ...mockRate(BTC, 1) },
        });

        expect(selectAssetFirstRowKeys(state)).toEqual([
            `${ALICE}/btc/`,
            `${ALICE}/eth/`,
            `${ALICE}/pol/`,
        ]);
    });

    it('leaves out a network the user has not enabled', () => {
        const state = createState({
            accounts: [mockAccount({ symbol: BTC })],
            enabledNetworks: [ETH],
        });

        expect(selectAssetFirstRowKeys(state)).toEqual([]);
    });

    it('leaves out a token nothing vouches for', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    tokens: [
                        { symbol: 'usdc', contract: USDC_ON_ETH, balance: '10' },
                        { contract: UNKNOWN_TOKEN, balance: '999999' },
                    ],
                }),
            ],
        });

        expect(selectAssetFirstRowKeys(state)).not.toContain(`${ALICE}/eth/${UNKNOWN_TOKEN}`);
    });

    it('leaves out a token the user hid', () => {
        const state = createState({
            accounts: [
                mockAccount({ tokens: [{ symbol: 'usdc', contract: USDC_ON_ETH, balance: '10' }] }),
            ],
            hiddenTokens: [USDC_ON_ETH],
        });

        expect(selectAssetFirstRowKeys(state)).not.toContain(`${ALICE}/eth/${USDC_ON_ETH}`);
    });

    it('keeps a token the user asked to see, definition or not', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: UNKNOWN_TOKEN, balance: '10' }] })],
            shownTokens: [UNKNOWN_TOKEN],
        });

        expect(selectAssetFirstRowKeys(state)).toContain(`${ALICE}/eth/${UNKNOWN_TOKEN}`);
    });

    it('keeps the tokens of a network that has no definitions at all', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: DSOL,
                    tokens: [{ contract: UNKNOWN_TOKEN, balance: '3' }],
                }),
            ],
            enabledNetworks: [DSOL],
            knownTokens: [],
        });

        expect(selectAssetFirstRowKeys(state)).toContain(`${ALICE}/dsol/${UNKNOWN_TOKEN}`);
    });

    it('leaves out an account the user hid', () => {
        const state = createState({
            accounts: [mockAccount({ symbol: BTC, isVisible: false })],
        });

        expect(selectAssetFirstRowKeys(state)).toEqual([]);
    });

    it('leaves out another wallet’s assets', () => {
        const state = createState({
            accounts: [mockAccount({ deviceState: BOB, symbol: BTC })],
        });

        expect(selectAssetFirstRowKeys(state)).toEqual([]);
    });

    it('hands back the same list while nothing it reads has changed', () => {
        const state = createState({ accounts: [mockAccount()] });

        expect(selectAssetFirstRows(state, ALICE)).toBe(selectAssetFirstRows(state, ALICE));
    });

    it('hands back the same row for an asset a write did not touch', () => {
        const untouched = mockAccount({ symbol: BTC, index: 0 });
        const written = mockAccount({ symbol: ETH, index: 1, balance: '1' });

        const [bitcoinBefore] = selectAssetFirstRows(
            createState({ accounts: [untouched, written] }),
            ALICE,
        ).filter(row => row.symbol === BTC);
        const [bitcoinAfter] = selectAssetFirstRows(
            createState({ accounts: [untouched, { ...written, formattedBalance: '2' }] }),
            ALICE,
        ).filter(row => row.symbol === BTC);

        expect(bitcoinAfter).toBe(bitcoinBefore);
    });
});

describe('the total over those rows', () => {
    const state = createState({
        accounts: [
            mockAccount({ symbol: ETH, balance: '2' }),
            mockAccount({ symbol: BTC, index: 1, balance: '0.5' }),
        ],
        rates: { ...mockRate(ETH, 3000), ...mockRate(BTC, 100000) },
    });

    it('adds up the rows it is given', () => {
        expect(getAssetFirstTotals(selectAssetFirstRows(state, ALICE)).fiatValue.toFixed()).toBe(
            '56000',
        );
    });

    it('follows a shorter list, so a filtered table and its total cannot disagree', () => {
        const largestHoldingOnly = selectAssetFirstRows(state, ALICE).slice(0, 1);

        expect(getAssetFirstTotals(largestHoldingOnly).fiatValue.toFixed()).toBe('50000');
    });

    it('says nothing about a week ago when no rate for it is known', () => {
        expect(getAssetFirstTotals(selectAssetFirstRows(state, ALICE)).weekChange).toBeUndefined();
    });
});
