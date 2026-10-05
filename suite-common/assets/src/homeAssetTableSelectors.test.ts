import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type HomeAssetTableState,
    selectHomeAssetTotals,
    selectNetworkFiatValue,
    selectShownNetworkSymbols,
    selectShownWalletAssetKeys,
    selectShownWalletAssetKeysOfNetwork,
    selectWalletAssetAmount,
} from './homeAssetTableSelectors';

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
}: MockStateParams): HomeAssetTableState => {
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
        networks: {
            [BTC]: { symbol: BTC, name: 'Bitcoin' },
            [ETH]: { symbol: ETH, name: 'Ethereum' },
            [POL]: { symbol: POL, name: 'Polygon PoS' },
        },
    } as unknown as HomeAssetTableState;
};

const selectHomeAssetRowKeys = (state: HomeAssetTableState) => selectShownWalletAssetKeys(state);

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

        expect(selectHomeAssetRowKeys(state)).toEqual(
            expect.arrayContaining([
                `${ALICE}/eth/`,
                `${ALICE}/eth/${USDC_ON_ETH}`,
                `${ALICE}/btc/`,
            ]),
        );
    });

    it('puts the most valuable assetAccount first, each network on its own', () => {
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

        expect(selectHomeAssetRowKeys(state)).toEqual([
            `${ALICE}/eth/`,
            `${ALICE}/eth/${USDC_ON_ETH}`,
            `${ALICE}/pol/${USDC_ON_POL}`,
            `${ALICE}/pol/`,
        ]);
    });

    it('ranks a small assetAccount by its own value, not by what the asset is worth in total', () => {
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

        expect(selectHomeAssetRowKeys(state)).toEqual([
            `${ALICE}/eth/${USDC_ON_ETH}`,
            `${ALICE}/eth/`,
            `${ALICE}/pol/${USDC_ON_POL}`,
            `${ALICE}/pol/`,
        ]);
    });

    it('leaves out a network the user has not enabled', () => {
        const state = createState({
            accounts: [mockAccount({ symbol: BTC })],
            enabledNetworks: [ETH],
        });

        expect(selectHomeAssetRowKeys(state)).toEqual([]);
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

        expect(selectHomeAssetRowKeys(state)).not.toContain(`${ALICE}/eth/${UNKNOWN_TOKEN}`);
    });

    it('leaves out a token the user hid', () => {
        const state = createState({
            accounts: [
                mockAccount({ tokens: [{ symbol: 'usdc', contract: USDC_ON_ETH, balance: '10' }] }),
            ],
            hiddenTokens: [USDC_ON_ETH],
        });

        expect(selectHomeAssetRowKeys(state)).not.toContain(`${ALICE}/eth/${USDC_ON_ETH}`);
    });

    it('keeps a token the user asked to see, definition or not', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: UNKNOWN_TOKEN, balance: '10' }] })],
            shownTokens: [UNKNOWN_TOKEN],
        });

        expect(selectHomeAssetRowKeys(state)).toContain(`${ALICE}/eth/${UNKNOWN_TOKEN}`);
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

        expect(selectHomeAssetRowKeys(state)).toContain(`${ALICE}/dsol/${UNKNOWN_TOKEN}`);
    });

    it('leaves out an account the user hid', () => {
        const state = createState({
            accounts: [mockAccount({ symbol: BTC, isVisible: false })],
        });

        expect(selectHomeAssetRowKeys(state)).toEqual([]);
    });

    it('leaves out another wallet’s assets', () => {
        const state = createState({
            accounts: [mockAccount({ deviceState: BOB, symbol: BTC })],
        });

        expect(selectHomeAssetRowKeys(state)).toEqual([]);
    });

    const bitcoin = mockAccount({ symbol: BTC, index: 0, balance: '1' });
    const ethereum = mockAccount({ symbol: ETH, index: 1, balance: '1' });
    const bitcoinKey = getWalletAssetKey({ deviceState: ALICE, symbol: BTC });
    const ethereumKey = getWalletAssetKey({ deviceState: ALICE, symbol: ETH });
    // Bitcoin outranks Ethereum until Ethereum's balance is written up.
    const twoAssetRates = { ...mockRate(BTC, 100000), ...mockRate(ETH, 3000) };

    const stateWithEthereumBalance = (balance: string) =>
        createState({
            accounts: [bitcoin, { ...ethereum, formattedBalance: balance }],
            rates: twoAssetRates,
        });

    it('hands back the same list when one balance changes but the order does not', () => {
        const before = stateWithEthereumBalance('1');
        const after = stateWithEthereumBalance('2');

        const keysBefore = selectShownWalletAssetKeys(before);
        const keysAfter = selectShownWalletAssetKeys(after);

        expect(selectWalletAssetAmount(before, ethereumKey)).toBe('1');
        expect(selectWalletAssetAmount(after, ethereumKey)).toBe('2');
        expect(keysAfter).toBe(keysBefore);
    });

    it('hands back a new list when a balance change reorders it', () => {
        expect(selectShownWalletAssetKeys(stateWithEthereumBalance('1'))).toEqual([
            bitcoinKey,
            ethereumKey,
        ]);
        expect(selectShownWalletAssetKeys(stateWithEthereumBalance('100'))).toEqual([
            ethereumKey,
            bitcoinKey,
        ]);
    });

    it('reports the same amount for an asset a write did not touch', () => {
        const untouched = mockAccount({ symbol: BTC, index: 0 });
        const written = mockAccount({ symbol: ETH, index: 1, balance: '1' });

        const before = selectWalletAssetAmount(
            createState({ accounts: [untouched, written] }),
            bitcoinKey,
        );
        const after = selectWalletAssetAmount(
            createState({ accounts: [untouched, { ...written, formattedBalance: '2' }] }),
            bitcoinKey,
        );

        expect(after).toBe(before);
    });
});

describe('the total over the wallet', () => {
    const state = createState({
        accounts: [
            mockAccount({ symbol: ETH, balance: '2' }),
            mockAccount({ symbol: BTC, index: 1, balance: '0.5' }),
        ],
        rates: { ...mockRate(ETH, 3000), ...mockRate(BTC, 100000) },
    });

    it('adds up every asset of the wallet', () => {
        expect(selectHomeAssetTotals(state).fiatValue?.toFixed()).toBe('56000');
    });

    it('says nothing at all while no asset of the wallet can be priced', () => {
        const unpriced = createState({
            accounts: [mockAccount({ symbol: ETH, balance: '2' })],
        });

        expect(selectHomeAssetTotals(unpriced).fiatValue).toBeUndefined();
    });

    it('says nothing about a week ago when no rate for it is known', () => {
        expect(selectHomeAssetTotals(state).weekChange).toBeUndefined();
    });
});

describe('the networks the table can be grouped by', () => {
    const bitcoin = mockAccount({ symbol: BTC, index: 0, balance: '1' });
    const ethereum = mockAccount({ symbol: ETH, index: 1, balance: '1' });
    const bitcoinKey = getWalletAssetKey({ deviceState: ALICE, symbol: BTC });
    const ethereumKey = getWalletAssetKey({ deviceState: ALICE, symbol: ETH });
    // Bitcoin outranks Ethereum until Ethereum's balance is written up.
    const rates = { ...mockRate(BTC, 100000), ...mockRate(ETH, 3000) };

    const stateWithEthereumBalance = (balance: string) =>
        createState({
            accounts: [bitcoin, { ...ethereum, formattedBalance: balance }],
            rates,
        });

    it('lists the networks held, the most valuable first', () => {
        expect(selectShownNetworkSymbols(stateWithEthereumBalance('1'))).toEqual([BTC, ETH]);
    });

    it('hands back the same networks and rows when a balance changes but the order does not', () => {
        const before = stateWithEthereumBalance('1');
        const after = stateWithEthereumBalance('2');

        const symbolsBefore = selectShownNetworkSymbols(before);
        // Every section asks, as the table does: reselect keeps one previous result per selector,
        // not one per argument, so asking for a single network would hide a cross-argument miss.
        const rowsBefore = [BTC, ETH].map(symbol =>
            selectShownWalletAssetKeysOfNetwork(before, symbol),
        );
        const rowsAfter = [BTC, ETH].map(symbol =>
            selectShownWalletAssetKeysOfNetwork(after, symbol),
        );

        expect(selectWalletAssetAmount(after, ethereumKey)).toBe('2');
        expect(selectShownNetworkSymbols(after)).toBe(symbolsBefore);
        expect(rowsAfter[0]).toBe(rowsBefore[0]);
        expect(rowsAfter[1]).toBe(rowsBefore[1]);
    });

    it('hands back a new list when a balance change reorders the networks', () => {
        expect(selectShownNetworkSymbols(stateWithEthereumBalance('100'))).toEqual([ETH, BTC]);
    });

    it('gives each network only the rows held on it', () => {
        const state = stateWithEthereumBalance('1');

        expect(selectShownWalletAssetKeysOfNetwork(state, BTC)).toEqual([bitcoinKey]);
        expect(selectShownWalletAssetKeysOfNetwork(state, ETH)).toEqual([ethereumKey]);
    });

    it('is worth what the rows held on it are worth', () => {
        const state = createState({
            accounts: [
                bitcoin,
                mockAccount({
                    symbol: ETH,
                    index: 1,
                    balance: '1',
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_ETH, balance: '500' }],
                }),
            ],
            rates: { ...rates, ...mockRate(ETH, 1, USDC_ON_ETH) },
        });

        expect(selectNetworkFiatValue(state, BTC)).toBe('100000');
        expect(selectNetworkFiatValue(state, ETH)).toBe('3500');
    });

    it('says nothing about what a network is worth while nothing it holds can be priced', () => {
        const state = createState({
            accounts: [bitcoin, { ...ethereum, formattedBalance: '1' }],
            rates: { ...mockRate(BTC, 100000) },
        });

        expect(selectNetworkFiatValue(state, BTC)).toBe('100000');
        expect(selectNetworkFiatValue(state, ETH)).toBeUndefined();
    });
});
