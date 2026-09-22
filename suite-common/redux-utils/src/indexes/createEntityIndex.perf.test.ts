import { type EntityIndex, createEntityIndex } from './createEntityIndex';

type Holding = { id: string; account: string; label: string };

type Source = Record<string, Holding[]>;

type State = { byAccount: Source };

const PARTITIONS = 200;
const PER_PARTITION = 100;
const REPEATS = 7;

// Wall clock on a developer's machine, so the budgets that matter are the ratios between the
// measurements. The absolute ones are only there to catch something pathological.
const BUDGET = {
    coldBuildMs: 4000,
    cachedReadShareOfBuild: 0.02,
    // A rebuild derives nothing it already knows, but it walks every entity again and fills the id
    // lookup from scratch, and that fill is most of a build. The ceiling is against the raw fill
    // below, not against the cold build.
    oneWriteShareOfBuild: 1,
    oneWriteMultipleOfRawMap: 2.2,
    unreadIndexShareOfBothIndexes: 0.8,
    bothIndexesAfterWriteShareOfCold: 1,
    coldBuildMultipleOfRawMap: 3,
};

const derivedHoldings = new WeakMap<Holding[], Holding[]>();

/** Stands in for the flattening a real index does, memoised the way a consumer of one would. */
const derivedHoldingsOf = (source: Source) =>
    Object.values(source).flatMap(holdings => {
        const known = derivedHoldings.get(holdings);

        if (known !== undefined) {
            return known;
        }

        const derived = holdings.map(holding => ({ ...holding }));
        derivedHoldings.set(holdings, derived);

        return derived;
    });

const createSource = (): Source =>
    Object.fromEntries(
        Array.from({ length: PARTITIONS }, (_, partition) => [
            `account-${partition}`,
            Array.from({ length: PER_PARTITION }, (_, position) => ({
                id: `${partition}-${position}`,
                account: `account-${partition}`,
                label: `label-${position % 20}`,
            })),
        ]),
    );

const writeOnePart = (source: Source): Source => ({
    ...source,
    'account-0': [
        ...(source['account-0'] as Holding[]),
        { id: 'written', account: 'account-0', label: 'label-0' },
    ],
});

type IndexUnderTest = EntityIndex<
    State,
    Holding,
    string,
    {
        byAccount: (holding: Holding) => string;
        byLabel: (holding: Holding) => string;
    }
>;

/** Swap this for another implementation to measure it against the same scenarios. */
const createIndexUnderTest = (): IndexUnderTest =>
    createEntityIndex({
        name: 'perfHoldings',
        selectSource: (state: State) => state.byAccount,
        // What a consumer that derives does with a source it is written piece by piece: the pieces
        // it already knows come back from the weak map, and only what changed is derived again.
        getEntities: derivedHoldingsOf,
        getId: (holding: Holding) => holding.id,
        secondaryIndexes: {
            byAccount: (holding: Holding) => holding.account,
            byLabel: (holding: Holding) => holding.label,
        },
    });

const median = (values: number[]) => {
    const sorted = [...values].sort((left, right) => left - right);

    return sorted[Math.floor(sorted.length / 2)] as number;
};

const timeOnce = (act: () => void) => {
    const startedAt = performance.now();
    act();

    return performance.now() - startedAt;
};

/** Each repeat gets its own index, so no measurement is taken against another's cache. */
const time = (scenario: (index: IndexUnderTest) => () => void) =>
    median(
        Array.from({ length: REPEATS }, () => {
            const index = createIndexUnderTest();

            return timeOnce(scenario(index));
        }),
    );

const report: Record<string, number> = {};

const measure = (label: string, scenario: (index: IndexUnderTest) => () => void) => {
    const milliseconds = time(scenario);
    report[label] = milliseconds;

    return milliseconds;
};

const timeRawFill = () => {
    const source = createSource();

    return median(
        Array.from({ length: REPEATS }, () =>
            timeOnce(() => {
                const byId = new Map<string, Holding>();
                const ids: string[] = [];

                for (const holdings of Object.values(source)) {
                    for (const holding of holdings) {
                        ids.push(holding.id);
                        byId.set(holding.id, holding);
                    }
                }
            }),
        ),
    );
};

const isPerfRun = process.env.PERF === '1';
const describePerf = isPerfRun ? describe : describe.skip;

describePerf(`building an index over ${PARTITIONS * PER_PARTITION} entities`, () => {
    const source = createSource();
    const written = writeOnePart(source);
    const state: State = { byAccount: source };
    const writtenState: State = { byAccount: written };

    afterAll(() => {
        // eslint-disable-next-line no-console
        console.table(report);
    });

    it('builds once, within the ceiling', () => {
        const coldBuild = measure('cold build', index => () => index.getIds(state));

        expect(coldBuild).toBeLessThan(BUDGET.coldBuildMs);
    });

    it('costs a small multiple of filling a plain map with the same entities', () => {
        const rawFill = timeRawFill();
        report['raw map and array fill'] = rawFill;

        expect(report['cold build'] as number).toBeLessThan(
            rawFill * BUDGET.coldBuildMultipleOfRawMap,
        );
    });

    it('answers a read of an unchanged source without rebuilding', () => {
        const coldBuild = report['cold build'] as number;
        const cachedRead = measure('cached read', index => {
            index.getIds(state);

            return () => {
                for (let read = 0; read < 100; read++) {
                    index.getIds(state);
                }
            };
        });

        expect(cachedRead).toBeLessThan(coldBuild * BUDGET.cachedReadShareOfBuild);
    });

    it('rebuilds a write for less than a build from nothing', () => {
        const coldBuild = report['cold build'] as number;
        const oneWrite = measure('rebuild after one write', index => {
            index.getIds(state);

            return () => index.getIds(writtenState);
        });

        expect(oneWrite).toBeLessThan(coldBuild * BUDGET.oneWriteShareOfBuild);
        expect(oneWrite).toBeLessThan(
            (report['raw map and array fill'] as number) * BUDGET.oneWriteMultipleOfRawMap,
        );
    });

    it('costs less for one entry than for both', () => {
        const oneIndex = measure('one entry read', index => () => {
            index.getBySecondaryKey(state, 'byAccount', 'account-7');
        });
        const bothIndexes = measure('both secondary indexes read', index => () => {
            index.getBySecondaryKey(state, 'byAccount', 'account-7');
            index.getBySecondaryKey(state, 'byLabel', 'label-3');
        });

        expect(oneIndex).toBeLessThan(bothIndexes * BUDGET.unreadIndexShareOfBothIndexes);
    });

    it('answers the inverse of a hidden list once per build, not once per read', () => {
        const hidden = ['0-0', '0-1', '7-3'];
        const inverseCold = measure('inverse of a hidden list, cold', index => () => {
            index.getAllExcept(state, hidden);
        });
        const inverseAgain = measure('inverse of a hidden list, read again', index => {
            index.getAllExcept(state, hidden);

            return () => {
                for (let read = 0; read < 100; read++) {
                    index.getAllExcept(state, hidden);
                }
            };
        });

        // The answer holds 19 997 of the 20 000 entities, so making it is a pass over all of
        // them — but only the first read pays for it.
        expect(inverseAgain).toBeLessThan(inverseCold * BUDGET.cachedReadShareOfBuild);
    });

    it('keeps an entry it is asked for again out of the next rebuild', () => {
        const readBoth = measure('both secondary indexes, after one write', index => {
            index.getBySecondaryKey(state, 'byAccount', 'account-7');
            index.getBySecondaryKey(state, 'byLabel', 'label-3');

            return () => {
                index.getBySecondaryKey(writtenState, 'byAccount', 'account-7');
                index.getBySecondaryKey(writtenState, 'byLabel', 'label-3');
            };
        });

        expect(readBoth).toBeLessThan(
            (report['both secondary indexes read'] as number) *
                BUDGET.bothIndexesAfterWriteShareOfCold,
        );
    });
});
