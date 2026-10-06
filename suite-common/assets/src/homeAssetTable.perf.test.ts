import {
    createAggregateIndex,
    createDerivedIndex,
    createIndex,
    createSecondaryIndex,
    createWeakMapSelector,
} from '@suite-common/redux-utils';
import {
    type NetworkSymbol,
    asNetworkSymbol,
    getAssetName,
    getDisplaySymbol,
} from '@suite-common/wallet-config';
import {
    type WalletAssetKey,
    getWalletAssetKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectDeviceAssetAccounts,
    selectEnabledNetworks,
    selectHiddenAssetAccountKeySet,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import {
    type HomeAssetTableState,
    selectNetworkFiatValue,
    selectShownNetworkSymbols,
    selectShownWalletAssetKeys,
    selectShownWalletAssetKeysOfNetwork,
    selectWalletAssetAmount,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetSymbol,
} from './homeAssetTableSelectors';

// The table read two ways over one state: through the selectors it ships with, and through a
// selector that only shapes the assets with an index and a secondary index over it. Both are read
// the way the components read them — the list, then a row per asset, then a section per network —
// and timed, and what each hands back is compared by identity after a write, which is what decides
// whether a component renders again.
//
// Wall clock on a developer's machine, so the budgets that matter are the ratios; the absolute
// ones only catch something pathological. `PERF=1` prints the table.

const ACCOUNTS_PER_NETWORK = Number(process.env.PERF_ACCOUNTS ?? 40);
const TOKENS_PER_ACCOUNT = 4;
const REPEATS = 5;

const WALLET = 'perfWallet@device:0' as StaticSessionId;
const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');
const POL = asNetworkSymbol('pol');
const NETWORKS: NetworkSymbol[] = [BTC, ETH, POL];

const NETWORK_RATES: Record<string, number> = { btc: 100_000, eth: 3_000, pol: 0.5 };

const tokenAddress = (network: NetworkSymbol, position: number) =>
    `0x${network.padEnd(8, '0')}${String(position).padStart(32, '0')}` as TokenAddress;

const KNOWN_TOKENS = Object.fromEntries(
    NETWORKS.map(network => [
        network,
        Array.from({ length: TOKENS_PER_ACCOUNT }, (_, position) =>
            tokenAddress(network, position),
        ),
    ]),
) as Record<NetworkSymbol, TokenAddress[]>;

type MockAccountParams = { symbol: NetworkSymbol; index: number; balance: string };

const mockAccount = ({ symbol, index, balance }: MockAccountParams): Account =>
    ({
        key: `descriptor${index}-${symbol}-${WALLET}`,
        deviceState: WALLET,
        symbol,
        index,
        accountType: 'normal',
        formattedBalance: balance,
        visible: true,
        tokens:
            symbol === BTC
                ? []
                : (KNOWN_TOKENS[symbol] ?? []).map((contract, position) => ({
                      contract,
                      symbol: `tok${position}`,
                      name: `Token ${position}`,
                      decimals: 6,
                      balance: String(100 + index + position),
                      type: 'ERC20',
                  })),
    }) as unknown as Account;

const createAccounts = () =>
    NETWORKS.flatMap(symbol =>
        Array.from({ length: ACCOUNTS_PER_NETWORK }, (_, index) =>
            mockAccount({ symbol, index, balance: String(1 + index / 10) }),
        ),
    );

const createRates = (tick = 0) => ({
    ...Object.fromEntries(
        NETWORKS.map(network => [
            getFiatRateKey(network, 'usd'),
            { rate: (NETWORK_RATES[network] ?? 1) + (network === BTC ? tick : 0) },
        ]),
    ),
    ...Object.fromEntries(
        NETWORKS.flatMap(network =>
            (KNOWN_TOKENS[network] ?? []).map(contract => [
                getFiatRateKey(network, 'usd', contract),
                { rate: 1 },
            ]),
        ),
    ),
});

type Fixture = { accounts: Account[]; rates: Record<string, { rate: number }> };

const createFixture = (): Fixture => ({ accounts: createAccounts(), rates: createRates() });

const tokenDefinitionsOf = (network: NetworkSymbol) => ({
    coin: { data: KNOWN_TOKENS[network], hide: [], show: [] },
});

// What no scenario writes is the same object in every state, as it is in the store.
const DEVICE = { selectedDevice: { state: { staticSessionId: WALLET } } };
const SETTINGS = { enabledNetworks: NETWORKS, localCurrency: 'usd' };
const TOKEN_DEFINITIONS = { [ETH]: tokenDefinitionsOf(ETH), [POL]: tokenDefinitionsOf(POL) };
const NETWORK_CONFIGS = Object.fromEntries(NETWORKS.map(network => [network, { symbol: network }]));

const createState = ({ accounts, rates }: Fixture): HomeAssetTableState =>
    ({
        device: DEVICE,
        wallet: {
            accounts,
            settings: SETTINGS,
            fiat: { current: rates, lastWeek: {}, historic: {} },
        },
        tokenDefinitions: TOKEN_DEFINITIONS,
        networks: NETWORK_CONFIGS,
    }) as unknown as HomeAssetTableState;

// --- The index side: a selector folds the assets, an index holds them, a selector prices and orders
// them, an index holds those, and a secondary index files them by network.

type PerfAsset = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    displaySymbol: string;
    name: string;
    // Primitives only, so that an asset rebuilt from the same accounts is shallowly the same.
    amount: string;
};

type PerfPricedAsset = PerfAsset & { fiatValue: string | undefined };

const createPerfSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

// Step one folds the positions into assets and knows nothing of rates, so a rates tick never
// reaches it.
const selectPerfAssets = createPerfSelector(
    [selectDeviceAssetAccounts, selectHiddenAssetAccountKeySet, selectEnabledNetworks],
    (assetAccounts, hidden, enabledNetworks): PerfAsset[] => {
        const balances = new Map<
            WalletAssetKey,
            { asset: Omit<PerfAsset, 'amount'>; balance: BigNumber }
        >();

        assetAccounts.forEach(assetAccount => {
            if (
                hidden.has(assetAccount.assetAccountKey) ||
                !enabledNetworks.includes(assetAccount.symbol)
            ) {
                return;
            }

            const held = balances.get(assetAccount.assetKey);

            balances.set(assetAccount.assetKey, {
                asset: held?.asset ?? {
                    assetKey: assetAccount.assetKey,
                    symbol: assetAccount.symbol,
                    contractAddress: assetAccount.contractAddress,
                    displaySymbol: getDisplaySymbol(
                        assetAccount.tokenInfo?.symbol ?? assetAccount.symbol,
                        assetAccount.contractAddress,
                    ),
                    name: getAssetName({
                        symbol: assetAccount.symbol,
                        tokenName: assetAccount.tokenInfo?.name,
                        tokenSymbol: assetAccount.tokenInfo?.symbol,
                    }),
                },
                balance: (held?.balance ?? new BigNumber(0)).plus(assetAccount.cryptoBalance),
            });
        });

        return [...balances.values()].map(({ asset, balance }) => ({
            ...asset,
            amount: balance.toFixed(),
        }));
    },
);

const assetsIndex = createIndex({
    name: 'perfAssets',
    source: selectPerfAssets,
    getId: (asset: PerfAsset) => asset.assetKey,
});

// Step two prices and orders the assets the index holds — the one place the rates are read, over
// the assets rather than the positions.
const selectPerfPricedAssets = createPerfSelector(
    [assetsIndex.getEntities, selectCurrentFiatRates, selectBaseCurrency],
    (assets, rates, baseCurrency): PerfPricedAsset[] =>
        assets
            .map(asset => {
                const fiatValue = toFiatCurrency({
                    amount: asset.amount,
                    rate: rates?.[getFiatRateKey(asset.symbol, baseCurrency, asset.contractAddress)]
                        ?.rate,
                });

                return { asset: { ...asset, fiatValue: fiatValue?.toFixed() }, worth: fiatValue };
            })
            .sort(
                (left, right) =>
                    (right.worth ?? new BigNumber(0)).comparedTo(left.worth ?? new BigNumber(0)) ??
                    0,
            )
            .map(({ asset }) => asset),
);

const pricedAssetsIndex = createIndex({
    name: 'perfPricedAssets',
    source: selectPerfPricedAssets,
    getId: (asset: PerfPricedAsset) => asset.assetKey,
});

const assetsByNetwork = createSecondaryIndex({
    name: 'perfAssetsByNetwork',
    source: pricedAssetsIndex,
    getKeys: (asset: PerfPricedAsset) => asset.symbol,
});

const selectPerfNetworkFiatValue = (state: HomeAssetTableState, symbol: NetworkSymbol) =>
    assetsByNetwork
        .getEntities(state, symbol)
        .reduce((total, asset) => total.plus(asset.fiatValue ?? 0), new BigNumber(0))
        .toFixed();

// --- The change-driven chain: every link does work only for what the link before said changed.

type Position = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    tokenSymbol: string | undefined;
    tokenName: string | undefined;
    balance: string;
};

type FoldedAsset = PerfAsset;

type RateEntry = { key: string; rate: number | undefined };

const accountsIndex = createIndex({
    name: 'chainAccounts',
    source: selectVisibleDeviceAccounts,
    getId: (account: Account) => account.key,
});

// One account into the positions it holds — what `toAssetAccounts` does, memoised per account by
// the aggregate index.
const toPositions = (account: Account): Position[] => [
    {
        assetKey: getWalletAssetKey({ deviceState: account.deviceState, symbol: account.symbol }),
        symbol: account.symbol,
        contractAddress: undefined,
        tokenSymbol: undefined,
        tokenName: undefined,
        balance: account.formattedBalance,
    },
    ...(account.tokens ?? [])
        .filter(token => new BigNumber(token.balance ?? '0').gt(0))
        .map(token => ({
            assetKey: getWalletAssetKey({
                deviceState: account.deviceState,
                symbol: account.symbol,
                contractAddress: token.contract as TokenAddress,
            }),
            symbol: account.symbol,
            contractAddress: token.contract as TokenAddress,
            tokenSymbol: token.symbol,
            tokenName: token.name,
            balance: token.balance ?? '0',
        })),
];

const chainAssetsIndex = createAggregateIndex({
    name: 'chainAssets',
    source: accountsIndex,
    expand: toPositions,
    getId: (position: Position) =>
        NETWORKS.includes(position.symbol) ? position.assetKey : undefined,
    // The same arithmetic as the selectors: BigNumber in, string out.
    reduce: (asset: FoldedAsset | undefined, position: Position): FoldedAsset => ({
        assetKey: position.assetKey,
        symbol: position.symbol,
        contractAddress: position.contractAddress,
        displaySymbol: getDisplaySymbol(
            position.tokenSymbol ?? position.symbol,
            position.contractAddress,
        ),
        name: getAssetName({
            symbol: position.symbol,
            tokenName: position.tokenName,
            tokenSymbol: position.tokenSymbol,
        }),
        amount: new BigNumber(asset?.amount ?? 0).plus(position.balance).toFixed(),
    }),
});

const selectRateEntries = createPerfSelector([selectCurrentFiatRates], (rates): RateEntry[] =>
    Object.entries(rates ?? {}).map(([key, rate]) => ({ key, rate: rate?.rate })),
);

const ratesIndex = createIndex({
    name: 'chainRates',
    source: selectRateEntries,
    getId: (entry: RateEntry) => entry.key,
});

const chainPricedIndex = createDerivedIndex({
    name: 'chainPricedAssets',
    source: chainAssetsIndex,
    join: { rate: ratesIndex },
    joinBy: (asset: FoldedAsset) => ({
        rate: getFiatRateKey(asset.symbol, 'usd', asset.contractAddress),
    }),
    toEntity: (asset: FoldedAsset, { rate }): PerfPricedAsset => ({
        ...asset,
        fiatValue: toFiatCurrency({ amount: asset.amount, rate: rate?.rate })?.toFixed(),
    }),
    sort: (left, right) =>
        new BigNumber(right.fiatValue ?? 0).comparedTo(new BigNumber(left.fiatValue ?? 0)) ?? 0,
});

const chainByNetwork = createSecondaryIndex({
    name: 'chainAssetsByNetwork',
    source: chainPricedIndex,
    getKeys: (asset: PerfPricedAsset) => asset.symbol,
});

const selectChainNetworkFiatValue = (state: HomeAssetTableState, symbol: NetworkSymbol) =>
    chainByNetwork
        .getEntities(state, symbol)
        .reduce((total, asset) => total.plus(asset.fiatValue ?? 0), new BigNumber(0))
        .toFixed();

// --- Reading the table the way the components do.

type TableRead = {
    rows: readonly WalletAssetKey[];
    rowValues: ReadonlyMap<string, readonly unknown[]>;
    sections: readonly NetworkSymbol[];
    sectionValues: ReadonlyMap<string, readonly unknown[]>;
};

const readThroughSelectors = (state: HomeAssetTableState): TableRead => {
    const rows = selectShownWalletAssetKeys(state);
    const sections = selectShownNetworkSymbols(state);

    return {
        rows,
        rowValues: new Map(
            rows.map(assetKey => [
                assetKey,
                [
                    selectWalletAssetSymbol(state, assetKey),
                    selectWalletAssetDisplaySymbol(state, assetKey),
                    selectWalletAssetAmount(state, assetKey),
                ],
            ]),
        ),
        sections,
        sectionValues: new Map(
            sections.map(symbol => [
                symbol,
                [
                    selectShownWalletAssetKeysOfNetwork(state, symbol),
                    selectNetworkFiatValue(state, symbol),
                ],
            ]),
        ),
    };
};

const readThroughChain = (state: HomeAssetTableState): TableRead => {
    const rows = chainPricedIndex.getIds(state);
    const sections = chainByNetwork.getKeys(state);

    return {
        rows,
        rowValues: new Map(
            rows.map(assetKey => {
                const asset = chainPricedIndex.getById(state, assetKey);

                return [assetKey, [asset?.symbol, asset?.displaySymbol, asset?.amount]];
            }),
        ),
        sections,
        sectionValues: new Map(
            sections.map(symbol => [
                symbol,
                [chainByNetwork.getIds(state, symbol), selectChainNetworkFiatValue(state, symbol)],
            ]),
        ),
    };
};

const readThroughIndexes = (state: HomeAssetTableState): TableRead => {
    const rows = pricedAssetsIndex.getIds(state);
    const sections = assetsByNetwork.getKeys(state);

    return {
        rows,
        rowValues: new Map(
            rows.map(assetKey => {
                const asset = pricedAssetsIndex.getById(state, assetKey);

                return [assetKey, [asset?.symbol, asset?.displaySymbol, asset?.amount]];
            }),
        ),
        sections,
        sectionValues: new Map(
            sections.map(symbol => [
                symbol,
                [assetsByNetwork.getIds(state, symbol), selectPerfNetworkFiatValue(state, symbol)],
            ]),
        ),
    };
};

/** How many keys a component would render again for: a key is changed when any value under it is. */
const countChanged = (
    before: ReadonlyMap<string, readonly unknown[]>,
    after: ReadonlyMap<string, readonly unknown[]>,
) =>
    [...after].filter(([key, values]) => {
        const held = before.get(key);

        return held === undefined || values.some((value, position) => value !== held[position]);
    }).length;

const timed = (read: () => void) => {
    const started = performance.now();
    read();

    return performance.now() - started;
};

const median = (samples: number[]) => [...samples].sort((a, b) => a - b)[samples.length >> 1] ?? 0;

type Scenario = { name: string; next: (fixture: Fixture) => Fixture };

const writeOneBalance: Scenario = {
    name: 'one account balance written',
    next: ({ accounts, rates }) => ({
        accounts: accounts.map((account, position) =>
            position === 7 ? { ...account, formattedBalance: '99' } : account,
        ),
        rates,
    }),
};

// One token's balance inside one account — the deepest write the store sees.
const oneTokenBalanceWritten: Scenario = {
    name: 'one token balance written, deep in one account',
    next: ({ accounts, rates }) => ({
        accounts: accounts.map((account, position) =>
            position === ACCOUNTS_PER_NETWORK + 7
                ? {
                      ...account,
                      tokens: (account.tokens ?? []).map((token, tokenPosition) =>
                          tokenPosition === TOKENS_PER_ACCOUNT - 1
                              ? { ...token, balance: '12345' }
                              : token,
                      ),
                  }
                : account,
        ),
        rates,
    }),
};

const halfTheBalancesWritten: Scenario = {
    name: 'every other account balance written',
    next: ({ accounts, rates }) => ({
        accounts: accounts.map((account, position) =>
            position % 2 === 0 ? { ...account, formattedBalance: '99' } : account,
        ),
        rates,
    }),
};

const everyAccountRebuiltUnchanged: Scenario = {
    name: 'every account rebuilt, same values',
    next: ({ accounts, rates }) => ({ accounts: accounts.map(account => ({ ...account })), rates }),
};

const oneRateMoved: Scenario = {
    name: 'fiat rates replaced, one rate moved',
    next: ({ accounts }) => ({ accounts, rates: createRates(1_000) }),
};

const ratesTick: Scenario = {
    name: 'fiat rates replaced, same values',
    next: ({ accounts }) => ({ accounts, rates: createRates() }),
};

const accountAdded: Scenario = {
    name: 'one account added',
    next: ({ accounts, rates }) => ({
        accounts: [
            ...accounts,
            mockAccount({ symbol: ETH, index: ACCOUNTS_PER_NETWORK, balance: '5' }),
        ],
        rates,
    }),
};

type Measurement = {
    scenario: string;
    reader: 'selectors' | 'indexes' | 'chain';
    ms: number;
    rowsChanged: number;
    sectionsChanged: number;
};

const measure = (
    reader: Measurement['reader'],
    read: (state: HomeAssetTableState) => TableRead,
    scenario: Scenario,
): Measurement => {
    const samples: number[] = [];
    let rowsChanged = 0;
    let sectionsChanged = 0;

    for (let repeat = 0; repeat < REPEATS; repeat++) {
        const fixture = createFixture();
        const first = read(createState(fixture));
        const after = createState(scenario.next(fixture));
        let second: TableRead | undefined;

        samples.push(
            timed(() => {
                second = read(after);
            }),
        );

        rowsChanged = countChanged(first.rowValues, second?.rowValues ?? new Map());
        sectionsChanged = countChanged(first.sectionValues, second?.sectionValues ?? new Map());
    }

    return { scenario: scenario.name, reader, ms: median(samples), rowsChanged, sectionsChanged };
};

const measureCold = (
    reader: Measurement['reader'],
    read: (state: HomeAssetTableState) => TableRead,
): Measurement => {
    const samples: number[] = [];

    for (let repeat = 0; repeat < REPEATS; repeat++) {
        const state = createState(createFixture());
        samples.push(timed(() => read(state)));
    }

    return {
        scenario: 'cold read',
        reader,
        ms: median(samples),
        rowsChanged: 0,
        sectionsChanged: 0,
    };
};

const measureCached = (
    reader: Measurement['reader'],
    read: (state: HomeAssetTableState) => TableRead,
): Measurement => {
    const state = createState(createFixture());
    read(state);
    const samples = Array.from({ length: REPEATS }, () => timed(() => read(state)));

    return {
        scenario: 'read again',
        reader,
        ms: median(samples),
        rowsChanged: 0,
        sectionsChanged: 0,
    };
};

/**
 * What discovery does to the store: every account first appears empty, then is written again with
 * its balance and tokens — two writes per account, a mounted table reading after each. The sum
 * of those reads, and of the rows and sections that came back new along the way.
 */
const measureDiscovery = (
    reader: Measurement['reader'],
    read: (state: HomeAssetTableState) => TableRead,
    ratesTickEvery = 0,
): Measurement => {
    const samples: number[] = [];
    let rowsChanged = 0;
    let sectionsChanged = 0;

    for (let repeat = 0; repeat < REPEATS; repeat++) {
        let rates = createRates();
        let writes = 0;
        const discovered: Account[] = [];
        let total = 0;
        let changedRows = 0;
        let changedSections = 0;
        let previous = read(createState({ accounts: discovered, rates }));

        const write = (accounts: Account[]) => {
            writes += 1;

            // A rate lands between the account writes, as the ticker does during discovery.
            if (ratesTickEvery > 0 && writes % ratesTickEvery === 0) {
                rates = createRates(writes);
            }

            const state = createState({ accounts, rates });
            let next: TableRead | undefined;

            total += timed(() => {
                next = read(state);
            });

            if (next !== undefined) {
                changedRows += countChanged(previous.rowValues, next.rowValues);
                changedSections += countChanged(previous.sectionValues, next.sectionValues);
                previous = next;
            }
        };

        createAccounts().forEach(account => {
            const empty = { ...account, formattedBalance: '0', tokens: [] } as Account;
            discovered.push(empty);
            write([...discovered]);
            discovered[discovered.length - 1] = account;
            write([...discovered]);
        });

        samples.push(total);
        rowsChanged = changedRows;
        sectionsChanged = changedSections;
    }

    return {
        scenario:
            `discovery: ${NETWORKS.length * ACCOUNTS_PER_NETWORK} accounts, 2 writes each` +
            (ratesTickEvery > 0 ? `, a rate moves every ${ratesTickEvery} writes` : ''),
        reader,
        ms: median(samples),
        rowsChanged,
        sectionsChanged,
    };
};

const report = (measurements: Measurement[]) => {
    if (process.env.PERF === undefined) {
        return;
    }

    const lines = measurements.map(
        ({ scenario, reader, ms, rowsChanged, sectionsChanged }) =>
            `${scenario.padEnd(66)} ${reader.padEnd(10)} ${ms.toFixed(3).padStart(9)} ms` +
            `  rows changed ${String(rowsChanged).padStart(4)}` +
            `  sections changed ${String(sectionsChanged).padStart(3)}`,
    );

    process.stdout.write(`\n${lines.join('\n')}\n\n`);
};

describe(`the home asset table over ${NETWORKS.length * ACCOUNTS_PER_NETWORK} accounts`, () => {
    const rowCount = NETWORKS.length + (NETWORKS.length - 1) * TOKENS_PER_ACCOUNT;

    it('reads the same rows and sections both ways', () => {
        const state = createState(createFixture());

        expect(readThroughIndexes(state).rows).toEqual(readThroughSelectors(state).rows);
        expect(readThroughChain(state).rows).toEqual(readThroughSelectors(state).rows);
        expect(readThroughIndexes(state).rows).toHaveLength(rowCount);
        expect(readThroughIndexes(state).sections).toEqual(readThroughSelectors(state).sections);
        expect([...readThroughChain(state).sections].sort()).toEqual(
            [...readThroughSelectors(state).sections].sort(),
        );
    });

    it('measures both readers', () => {
        const measurements: Measurement[] = [];

        for (const [reader, read] of [
            ['selectors', readThroughSelectors],
            ['indexes', readThroughIndexes],
            ['chain', readThroughChain],
        ] as const) {
            measurements.push(measureCold(reader, read), measureCached(reader, read));

            for (const scenario of [
                writeOneBalance,
                oneTokenBalanceWritten,
                halfTheBalancesWritten,
                everyAccountRebuiltUnchanged,
                ratesTick,
                oneRateMoved,
                accountAdded,
            ]) {
                measurements.push(measure(reader, read, scenario));
            }

            measurements.push(measureDiscovery(reader, read), measureDiscovery(reader, read, 10));
        }

        report(measurements);

        const of = (reader: Measurement['reader'], scenario: string) =>
            measurements.find(
                measurement => measurement.reader === reader && measurement.scenario === scenario,
            ) as Measurement;

        // A read of an unchanged state is a lookup, not a build.
        expect(of('indexes', 'read again').ms).toBeLessThan(of('indexes', 'cold read').ms * 0.2);

        // A write to one account's balance reaches the row of that asset and its network and
        // nothing else — through both readers: the selectors answer primitives per row and keep
        // their lists through hand-written equality checks, the indexes keep them by construction.
        for (const reader of ['selectors', 'indexes', 'chain'] as const) {
            expect(of(reader, writeOneBalance.name).rowsChanged).toBe(1);
            expect(of(reader, writeOneBalance.name).sectionsChanged).toBe(1);
            expect(of(reader, ratesTick.name).rowsChanged).toBe(0);
            expect(of(reader, ratesTick.name).sectionsChanged).toBe(0);
            // The added account holds the network's coin and its four tokens: five assets.
            expect(of(reader, accountAdded.name).rowsChanged).toBe(1 + TOKENS_PER_ACCOUNT);
            expect(of(reader, accountAdded.name).sectionsChanged).toBeLessThanOrEqual(2);
        }

        // The indexes are not a regression on the common write: a balance change is read within a
        // small multiple of what the selectors take for it.
        expect(of('indexes', writeOneBalance.name).ms).toBeLessThan(
            Math.max(of('selectors', writeOneBalance.name).ms * 3, 5),
        );

        // Nor over a whole discovery, where every other write adds an id and the secondary index
        // refiles its lists. The rows come back with the same churn through both readers — an
        // added account first gives its network's coin a row, then fills that row and its tokens.
        // The sections do not: when a network first appears, the selectors' grouping is a new
        // map of new arrays, so every section already on screen is handed a new list, whereas a
        // secondary index settles each key on its own and only the new network's list is new.
        const discovery = measurements.find(
            measurement =>
                measurement.reader === 'selectors' && measurement.scenario.startsWith('discovery'),
        ) as Measurement;
        const indexedDiscovery = measurements.find(
            measurement =>
                measurement.reader === 'indexes' && measurement.scenario.startsWith('discovery'),
        ) as Measurement;

        expect(indexedDiscovery.rowsChanged).toBe(discovery.rowsChanged);
        expect(indexedDiscovery.sectionsChanged).toBeLessThanOrEqual(discovery.sectionsChanged);

        // The change-driven chain does the same work for a reader and far less for a write: a
        // balance write reaches one account, one asset and one price.
        const chainDiscovery = measurements.find(
            measurement =>
                measurement.reader === 'chain' && measurement.scenario.startsWith('discovery'),
        ) as Measurement;

        expect(chainDiscovery.rowsChanged).toBe(discovery.rowsChanged);
        expect(chainDiscovery.sectionsChanged).toBeLessThanOrEqual(discovery.sectionsChanged);
        expect(of('chain', writeOneBalance.name).ms).toBeLessThan(
            of('selectors', writeOneBalance.name).ms,
        );
        expect(indexedDiscovery.ms).toBeLessThan(Math.max(discovery.ms * 3, 50));
    });
});
