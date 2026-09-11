/* eslint-disable no-console */
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { getTargetAmounts } from '../getTargetAmounts';
import { getTransactionSearchLookups } from '../transactionSearchIndex';

const COUNT = 5_000;
const address = (i: number) => `bc1q${i.toString(36).padStart(8, '0')}`;
const transactions = Array.from({ length: COUNT }, (_, i) => ({
    txid: `tx${i}`,
    symbol: 'btc',
    tokens: [],
    amount: `${i % 1000}`,
    targets: [{ addresses: [address(i)], amount: `${i % 1000}` }],
    details: {
        vin: [{ addresses: [address(i * 2)] }],
        vout: [{ addresses: [address(i)] }, { addresses: [address(i * 3)] }],
    },
})) as unknown as WalletAccountTransaction[];

const search = 'alice';
const index = getTransactionSearchLookups(transactions);
console.log(`${COUNT} transactions -> ${index.byAddress.size} distinct addresses\n`);

const time = (label: string, run: () => unknown) => {
    run();
    const t = performance.now();
    for (let i = 0; i < 10; i += 1) run();
    console.log(
        `  ${label.padEnd(36)} ${(performance.now() - t).toFixed(1).padStart(7)} ms / 10 runs`,
    );
};

time('build address map (now memoized away)', () => {
    const byAddress: Record<string, Set<string>> = {};
    transactions.forEach(t => {
        const add = (a: string) => {
            if (!byAddress[a]) byAddress[a] = new Set();
            byAddress[a].add(t.txid);
        };
        t.details.vin.forEach(v => v.addresses?.forEach(add));
        t.details.vout.forEach(v => v.addresses?.forEach(add));
        t.targets.forEach(v => v.addresses?.forEach(add));
    });

    return byAddress;
});

time('scan every address key, per query', () =>
    [...index.byAddress].flatMap(([a, group]) =>
        a.toLowerCase().includes(search) ? group.ids : [],
    ),
);

time('getTargetAmounts pass', () => transactions.flatMap(t => getTargetAmounts(t)));

time('final filter over all transactions', () => {
    const found = new Set(['tx1', 'tx2']);

    return transactions.filter(t => found.has(t.txid));
});
