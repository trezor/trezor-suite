import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type Rate, type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    HOME_ASSET_ROW_LIMIT,
    type HomeAssetTableState,
    selectDisplayedWalletAssetKeys,
    selectHiddenWalletAssetKeys,
    selectHomeAssetTotals,
    selectNetworkFiatValue,
    selectShownNetworkSymbols,
    selectShownWalletAssetKeys,
    selectShownWalletAssetKeysOfNetwork,
    selectSmallBalanceSummary,
    selectWalletAssetAmount,
} from './homeAssetTableSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;
const BOB = 'bobWallet@device:1' as StaticSessionId;

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');
const POL = asNetworkSymbol('pol');
const DSOL = asNetworkSymbol('dsol');
const TEST = asNetworkSymbol('test');

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

// A current rate carries the dollar rate too; in dollars the two are the same number.
const mockRate = (
    symbol: Account['symbol'],
    rate: number,
    contract?: TokenAddress,
    currency: BaseCurrencyCode = 'usd',
    usdRate: number | undefined = currency === 'usd' ? rate : undefined,
) => ({
    [getFiatRateKey(symbol, currency, contract)]: { rate, usdRate },
});

type MockStateParams = {
    accounts: Account[];
    enabledNetworks?: Account['symbol'][];
    rates?: Record<string, Partial<Rate>>;
    knownTokens?: TokenAddress[];
    hiddenTokens?: TokenAddress[];
    areSmallBalancesShown?: boolean;
    shownTokens?: TokenAddress[];
    localCurrency?: BaseCurrencyCode;
};

const createState = ({
    accounts,
    enabledNetworks = [BTC, ETH, POL],
    rates = {},
    knownTokens = [USDC_ON_ETH, USDC_ON_POL],
    hiddenTokens = [],
    areSmallBalancesShown = true,
    shownTokens = [],
    localCurrency = 'usd',
}: MockStateParams): HomeAssetTableState => {
    const definitions = {
        coin: { data: knownTokens, hide: hiddenTokens, show: shownTokens },
    };

    return {
        device: { selectedDevice: { state: { staticSessionId: ALICE } } },
        wallet: {
            accounts,
            settings: {
                enabledNetworks,
                localCurrency,
                areHomeAssetSmallBalancesShown: areSmallBalancesShown,
            },
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

describe('the tokens the table leaves out', () => {
    const stateWithBitcoinBalance = (balance: string) =>
        createState({
            accounts: [
                mockAccount({
                    symbol: ETH,
                    tokens: [
                        { symbol: 'usdc', contract: USDC_ON_ETH, balance: '10' },
                        { symbol: 'bad', contract: UNKNOWN_TOKEN, balance: '5' },
                    ],
                }),
                mockAccount({ symbol: BTC, index: 1, balance }),
            ],
            hiddenTokens: [USDC_ON_ETH],
        });

    it('tells apart what the user hid from what nothing vouches for', () => {
        const state = stateWithBitcoinBalance('1');

        expect(selectHiddenWalletAssetKeys(state, 'hiddenByUser')).toEqual([
            `${ALICE}/eth/${USDC_ON_ETH}`,
        ]);
        expect(selectHiddenWalletAssetKeys(state, 'unrecognized')).toEqual([
            `${ALICE}/eth/${UNKNOWN_TOKEN}`,
        ]);
    });

    it('hands back the same lists when a balance elsewhere changes', () => {
        const before = stateWithBitcoinBalance('1');
        const after = stateWithBitcoinBalance('2');

        // Both groups ask, as the page does: reselect keeps one previous result per selector,
        // not one per argument, so asking for a single reason would hide a cross-argument miss.
        const byUserBefore = selectHiddenWalletAssetKeys(before, 'hiddenByUser');
        const unrecognizedBefore = selectHiddenWalletAssetKeys(before, 'unrecognized');

        expect(selectHiddenWalletAssetKeys(after, 'hiddenByUser')).toBe(byUserBefore);
        expect(selectHiddenWalletAssetKeys(after, 'unrecognized')).toBe(unrecognizedBefore);
    });

    it('puts the most valuable hidden token first, and settles a tie on what is held', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: ETH,
                    tokens: [
                        { symbol: 'usdc', contract: USDC_ON_ETH, balance: '10' },
                        { symbol: 'bad', contract: UNKNOWN_TOKEN, balance: '5' },
                    ],
                }),
                mockAccount({
                    symbol: POL,
                    index: 1,
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_POL, balance: '1000' }],
                }),
            ],
            rates: mockRate(ETH, 1, USDC_ON_ETH),
            hiddenTokens: [USDC_ON_ETH, USDC_ON_POL],
        });

        // Only the Ethereum one can be priced, so it leads; the other falls back to its balance.
        expect(selectHiddenWalletAssetKeys(state, 'hiddenByUser')).toEqual([
            `${ALICE}/eth/${USDC_ON_ETH}`,
            `${ALICE}/pol/${USDC_ON_POL}`,
        ]);
    });

    it('leaves out a hidden token on a network the user has not enabled', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: POL,
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_POL, balance: '10' }],
                }),
            ],
            enabledNetworks: [BTC, ETH],
            hiddenTokens: [USDC_ON_POL],
        });

        expect(selectHiddenWalletAssetKeys(state, 'hiddenByUser')).toEqual([]);
    });
});

describe('the small balances the switch hides', () => {
    // Bitcoin is worth $2 here, the Ethereum token 50c: one is small, the other is not.
    const stateWithSmallBalances = (areSmallBalancesShown: boolean) =>
        createState({
            accounts: [
                mockAccount({
                    symbol: ETH,
                    balance: '0',
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_ETH, balance: '0.5' }],
                }),
                mockAccount({ symbol: BTC, index: 1, balance: '2' }),
            ],
            rates: {
                ...mockRate(BTC, 1),
                ...mockRate(ETH, 1),
                ...mockRate(ETH, 1, USDC_ON_ETH),
            },
            areSmallBalancesShown,
        });

    it('draws every row while the switch is on', () => {
        expect(selectDisplayedWalletAssetKeys(stateWithSmallBalances(true))).toEqual([
            `${ALICE}/btc/`,
            `${ALICE}/eth/${USDC_ON_ETH}`,
            `${ALICE}/eth/`,
        ]);
    });

    it('leaves out what is worth under a dollar while the switch is off', () => {
        const state = stateWithSmallBalances(false);

        expect(selectDisplayedWalletAssetKeys(state)).toEqual([`${ALICE}/btc/`]);
        // What the wallet holds is unchanged — only what the table draws is.
        expect(selectShownWalletAssetKeys(state)).toHaveLength(3);
    });

    it('leaves the wallet total alone, hidden or not', () => {
        const shown = selectHomeAssetTotals(stateWithSmallBalances(true));
        const hidden = selectHomeAssetTotals(stateWithSmallBalances(false));

        expect(shown.fiatValue?.toFixed()).toBe('2.5');
        expect(hidden.fiatValue?.toFixed()).toBe('2.5');
    });

    it('says how many there are and what they come to', () => {
        const summary = selectSmallBalanceSummary(stateWithSmallBalances(true));

        // The Ethereum account holds nothing, so it is worth nothing, so it is small too.
        expect(summary?.assetCount).toBe(2);
        expect(summary?.fiatValue.toFixed()).toBe('0.5');
    });

    it('counts nothing the table already leaves out', () => {
        // The hidden token is worth 50c, but it is hidden, so the switch must not speak for it.
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: ETH,
                    balance: '2',
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_ETH, balance: '0.5' }],
                }),
            ],
            rates: { ...mockRate(ETH, 1), ...mockRate(ETH, 1, USDC_ON_ETH) },
            hiddenTokens: [USDC_ON_ETH],
        });

        expect(selectSmallBalanceSummary(state)).toBeUndefined();
    });

    describe('in a currency other than the dollar', () => {
        // A dollar is 20 CZK. The Ethereum token is worth 10 CZK, which is 50c; Bitcoin is worth $100.
        const stateInCzk = createState({
            accounts: [
                mockAccount({
                    symbol: ETH,
                    balance: '0',
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_ETH, balance: '10' }],
                }),
                mockAccount({ symbol: BTC, index: 1, balance: '1' }),
            ],
            rates: {
                ...mockRate(BTC, 2000, undefined, 'czk', 100),
                ...mockRate(ETH, 1, undefined, 'czk', 0.05),
                ...mockRate(ETH, 1, USDC_ON_ETH, 'czk', 0.05),
            },
            localCurrency: 'czk',
            areSmallBalancesShown: false,
        });

        it('draws the line at a dollar, not at one of the currency', () => {
            expect(selectDisplayedWalletAssetKeys(stateInCzk)).toEqual([`${ALICE}/btc/`]);
        });

        it('still says what they come to in the chosen currency', () => {
            expect(selectSmallBalanceSummary(stateInCzk)?.fiatValue.toFixed()).toBe('10');
        });
    });

    describe('an asset nothing can price', () => {
        // The feeds answered for the shown token and could not price it: it is not on CoinGecko.
        const unpricedRate = (contract: TokenAddress, isLoading = false) => ({
            [getFiatRateKey(ETH, 'usd', contract)]: {
                isLoading,
                error: 'Missing token definition',
            },
        });
        const stateWithAnUnpricedToken = (areSmallBalancesShown: boolean) =>
            createState({
                accounts: [
                    mockAccount({
                        symbol: ETH,
                        balance: '0',
                        tokens: [{ contract: UNKNOWN_TOKEN, balance: '999999' }],
                    }),
                    mockAccount({ symbol: BTC, index: 1, balance: '2' }),
                ],
                rates: { ...mockRate(BTC, 1), ...mockRate(ETH, 1), ...unpricedRate(UNKNOWN_TOKEN) },
                shownTokens: [UNKNOWN_TOKEN],
                areSmallBalancesShown,
            });

        it('goes below everything that can be priced, even what is worth nothing', () => {
            expect(selectDisplayedWalletAssetKeys(stateWithAnUnpricedToken(true))).toEqual([
                `${ALICE}/btc/`,
                `${ALICE}/eth/`,
                `${ALICE}/eth/${UNKNOWN_TOKEN}`,
            ]);
        });

        it('counts as a small balance and leaves with them', () => {
            const state = stateWithAnUnpricedToken(false);

            expect(selectDisplayedWalletAssetKeys(state)).toEqual([`${ALICE}/btc/`]);
            expect(selectSmallBalanceSummary(state)?.assetCount).toBe(2);
        });

        it('is not taken for dust while its answer is still on its way', () => {
            const state = createState({
                accounts: [
                    mockAccount({
                        symbol: ETH,
                        balance: '2',
                        tokens: [{ contract: UNKNOWN_TOKEN, balance: '999999' }],
                    }),
                ],
                rates: { ...mockRate(ETH, 1), ...unpricedRate(UNKNOWN_TOKEN, true) },
                shownTokens: [UNKNOWN_TOKEN],
                areSmallBalancesShown: false,
            });

            expect(selectDisplayedWalletAssetKeys(state)).toHaveLength(2);
            expect(selectSmallBalanceSummary(state)).toBeUndefined();
        });

        it('is not taken for dust while nothing has been asked about it, as with a testnet', () => {
            const state = createState({
                accounts: [
                    mockAccount({ symbol: BTC, balance: '2' }),
                    mockAccount({ symbol: TEST, index: 1, balance: '5' }),
                ],
                enabledNetworks: [BTC, TEST],
                rates: mockRate(BTC, 1),
                areSmallBalancesShown: false,
            });

            expect(selectDisplayedWalletAssetKeys(state)).toEqual([
                `${ALICE}/btc/`,
                `${ALICE}/test/`,
            ]);
            expect(selectSmallBalanceSummary(state)).toBeUndefined();
        });
    });

    it('says nothing when every balance is worth having', () => {
        const state = createState({
            accounts: [mockAccount({ symbol: BTC, balance: '2' })],
            rates: mockRate(BTC, 1),
        });

        expect(selectSmallBalanceSummary(state)).toBeUndefined();
    });
});

describe('the networks the table shows once small balances are off', () => {
    // Bitcoin is worth $2; the only thing held on Polygon is a 50c token.
    const stateWithASmallOnlyNetwork = (areSmallBalancesShown: boolean) =>
        createState({
            accounts: [
                mockAccount({ symbol: BTC, balance: '2' }),
                mockAccount({
                    symbol: POL,
                    index: 1,
                    balance: '0',
                    tokens: [{ symbol: 'usdc', contract: USDC_ON_POL, balance: '0.5' }],
                }),
            ],
            rates: {
                ...mockRate(BTC, 1),
                ...mockRate(POL, 1),
                ...mockRate(POL, 1, USDC_ON_POL),
            },
            areSmallBalancesShown,
        });

    it('drops a network holding nothing but small balances, and brings it back', () => {
        expect(selectShownNetworkSymbols(stateWithASmallOnlyNetwork(true))).toEqual([BTC, POL]);
        expect(selectShownNetworkSymbols(stateWithASmallOnlyNetwork(false))).toEqual([BTC]);
    });

    it('leaves what a network is worth alone, hidden or not', () => {
        // Ethereum holds $2.50: a $2 coin and a 50c token, one of them small.
        const stateWithBothSizes = (areSmallBalancesShown: boolean) =>
            createState({
                accounts: [
                    mockAccount({
                        symbol: ETH,
                        balance: '2',
                        tokens: [{ symbol: 'usdc', contract: USDC_ON_ETH, balance: '0.5' }],
                    }),
                ],
                rates: { ...mockRate(ETH, 1), ...mockRate(ETH, 1, USDC_ON_ETH) },
                areSmallBalancesShown,
            });

        expect(selectNetworkFiatValue(stateWithBothSizes(true), ETH)).toBe('2.5');
        expect(selectNetworkFiatValue(stateWithBothSizes(false), ETH)).toBe('2.5');
        // The small row is gone from the section even though the heading still counts it.
        expect(selectShownWalletAssetKeysOfNetwork(stateWithBothSizes(false), ETH)).toEqual([
            `${ALICE}/eth/`,
        ]);
    });
});

describe('the fold a long table shows', () => {
    const manyTokens = (count: number) =>
        Array.from(
            { length: count },
            (_, index) => `0x${(index + 1).toString(16).padStart(40, '0')}` as TokenAddress,
        );

    type TokenCounts = {
        eth: number;
        pol: number;
    };

    // Every token is worth $10, so none of them is a small balance.
    const stateWithTokenCounts = ({ eth, pol }: TokenCounts) => {
        const ethTokens = manyTokens(eth);
        const polTokens = manyTokens(pol);

        return createState({
            accounts: [
                mockAccount({
                    symbol: ETH,
                    balance: '0',
                    tokens: ethTokens.map(contract => ({ symbol: 'tkn', contract, balance: '10' })),
                }),
                mockAccount({
                    symbol: POL,
                    index: 1,
                    balance: '0',
                    tokens: polTokens.map(contract => ({ symbol: 'tkn', contract, balance: '10' })),
                }),
            ],
            rates: Object.assign(
                {},
                ...ethTokens.map(contract => mockRate(ETH, 1, contract)),
                ...polTokens.map(contract => mockRate(POL, 1, contract)),
            ),
            knownTokens: [...ethTokens, ...polTokens],
        });
    };

    it('shows only the first few of a longer list', () => {
        const state = stateWithTokenCounts({ eth: 30, pol: 0 });

        // Thirty tokens, and the two coins the accounts themselves hold.
        expect(selectDisplayedWalletAssetKeys(state)).toHaveLength(32);
        expect(selectDisplayedWalletAssetKeys(state, true)).toHaveLength(HOME_ASSET_ROW_LIMIT);
    });

    it('counts assets, not networks, and can leave a whole network out', () => {
        // Seven on Ethereum plus its coin fills the fold exactly, so Polygon waits for "show more".
        const state = stateWithTokenCounts({ eth: 7, pol: 3 });

        expect(selectShownNetworkSymbols(state)).toEqual([ETH, POL]);
        expect(selectShownNetworkSymbols(state, true)).toEqual([ETH]);
        expect(selectShownWalletAssetKeysOfNetwork(state, ETH, true)).toHaveLength(
            HOME_ASSET_ROW_LIMIT,
        );
        expect(selectShownWalletAssetKeysOfNetwork(state, POL, true)).toEqual([]);
    });

    it('stops part way through a network when the fold runs out there', () => {
        // Ethereum holds eleven rows; the fold takes eight of them and nothing else.
        const state = stateWithTokenCounts({ eth: 10, pol: 3 });

        expect(selectShownWalletAssetKeysOfNetwork(state, ETH, true)).toEqual(
            selectShownWalletAssetKeysOfNetwork(state, ETH).slice(0, HOME_ASSET_ROW_LIMIT),
        );
        expect(selectShownNetworkSymbols(state, true)).toEqual([ETH]);
    });

    it('hands every network its rows once the fold is past', () => {
        const state = stateWithTokenCounts({ eth: 6, pol: 6 });

        expect(selectShownWalletAssetKeysOfNetwork(state, ETH)).toHaveLength(7);
        expect(selectShownWalletAssetKeysOfNetwork(state, POL)).toHaveLength(7);
    });
});
