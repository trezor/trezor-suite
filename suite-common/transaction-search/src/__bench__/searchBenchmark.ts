/* eslint-disable no-console */
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { advancedSearchTransactions } from '../advancedSearchTransactions';
import { type SearchAccountLabels } from '../searchLabels';
import { advancedSearchTransactions as advancedSearchBefore } from './advancedSearchTransactions.before';

const TRANSACTION_COUNT = Number(process.argv[2] ?? 5_000);
const KEYSTROKES = 10;

const address = (index: number) => `bc1q${index.toString(36).padStart(8, '0')}`;

const mockTransaction = (index: number): WalletAccountTransaction =>
    ({
        txid: `tx${index}`,
        symbol: 'btc',
        type: 'recv',
        amount: `${index % 1000}`,
        fee: '100',
        tokens: [],
        blockTime: 1_700_000_000 + index,
        blockHeight: index,
        targets: [{ addresses: [address(index)], amount: `${index % 1000}` }],
        details: {
            vin: [{ addresses: [address(index * 2)] }],
            vout: [{ addresses: [address(index)] }, { addresses: [address(index * 3)] }],
        },
    }) as unknown as WalletAccountTransaction;

const transactions = Array.from({ length: TRANSACTION_COUNT }, (_, index) =>
    mockTransaction(index),
);

// A realistic handful of labels rather than one per transaction.
const accountLabels: SearchAccountLabels = {
    accountLabel: 'Savings',
    outputLabels: new Map(
        Array.from({ length: 50 }, (_, index) => [
            `tx${index * 7}`,
            new Map([[`tx${index * 7}-0`, index % 2 === 0 ? 'rent' : 'coffee']]),
        ]),
    ),
    addressLabels: new Map(
        Array.from({ length: 50 }, (_, index) => [address(index * 11), 'alice']),
    ),
};

const time = (label: string, run: () => void) => {
    run(); // warm up, so we measure the work and not the JIT
    const started = performance.now();
    run();
    const elapsed = performance.now() - started;
    console.log(`  ${label.padEnd(12)} ${elapsed.toFixed(1).padStart(8)} ms`);

    return elapsed;
};

type Search = (
    transactions: WalletAccountTransaction[],
    accountLabels: SearchAccountLabels,
    search: string,
) => WalletAccountTransaction[];

// Typing a query one character at a time is what the search box actually does.
const typing = (query: string) =>
    Array.from({ length: KEYSTROKES }, (_, index) =>
        query.slice(0, query.length - index),
    ).reverse();

const scenario = (name: string, query: string) => {
    const queries = typing(query);
    const run = (search: Search) => () =>
        queries.forEach(text => search(transactions, accountLabels, text));

    console.log(`\n${name}  (${KEYSTROKES} keystrokes of "${query}")`);
    const before = time('before', run(advancedSearchBefore));
    const after = time('after', run(advancedSearchTransactions));
    console.log(`  ${'speedup'.padEnd(12)} ${(before / after).toFixed(1).padStart(8)}x`);

    const beforeResult = advancedSearchBefore(transactions, accountLabels, query);
    const afterResult = advancedSearchTransactions(transactions, accountLabels, query);
    const agree =
        beforeResult.length === afterResult.length &&
        beforeResult.every((transaction, index) => transaction === afterResult[index]);
    console.log(
        `  ${'same result'.padEnd(12)} ${String(agree).padStart(8)}  (${afterResult.length} matches)`,
    );
};

console.log(
    `${TRANSACTION_COUNT} transactions, ${accountLabels.addressLabels.size} address labels`,
);

scenario('simple search', 'alice');
scenario('address search', address(4_000));
scenario('AND query', 'alice&rent');
scenario('AND + OR query', 'alice&rent|coffee');
// The amount pass is meant to run for this one, so it is the honest lower bound on the win.
scenario('numeric search', '4200');
