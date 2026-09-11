import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type SearchAccountLabels } from './searchLabels';
import { getTransactionSearchIndex } from './transactionSearchIndex';

const mockTransaction = (txid: string, address: string): WalletAccountTransaction =>
    ({
        txid,
        details: { vin: [{ addresses: [address] }], vout: [] },
        targets: [{ addresses: [address] }],
    }) as unknown as WalletAccountTransaction;

const mockLabels = (): SearchAccountLabels => ({
    accountLabel: null,
    outputLabels: new Map([['tx1', new Map([['tx1-0', 'rent']])]]),
    addressLabels: new Map([['bc1qalice', 'alice']]),
});

describe('getTransactionSearchIndex', () => {
    it('finds every transaction that used an address', () => {
        const transactions = [
            mockTransaction('tx1', 'bc1qalice'),
            mockTransaction('tx2', 'bc1qbob'),
        ];

        const { txidsByAddress } = getTransactionSearchIndex(transactions, mockLabels());

        expect(txidsByAddress['bc1qalice']).toEqual(new Set(['tx1']));
        expect(txidsByAddress['bc1qbob']).toEqual(new Set(['tx2']));
    });

    it('turns the output labels inside out', () => {
        const { txidsByOutputLabel } = getTransactionSearchIndex([], mockLabels());

        expect(txidsByOutputLabel['rent']).toEqual(['tx1']);
    });

    it('turns the address labels inside out', () => {
        const { addressesByLabel } = getTransactionSearchIndex([], mockLabels());

        expect(addressesByLabel['alice']).toEqual(['bc1qalice']);
    });

    it('builds once for the same transactions and labels', () => {
        // The reason this exists. Typing in the search box hands over the same two objects on every
        // keystroke, and an advanced query hands them over once per `&`/`|` term; without this,
        // each of those walked every input, output and target of every transaction again.
        const transactions = [mockTransaction('tx1', 'bc1qalice')];
        const labels = mockLabels();

        expect(getTransactionSearchIndex(transactions, labels)).toBe(
            getTransactionSearchIndex(transactions, labels),
        );
    });

    it('builds again once the transactions are replaced', () => {
        const labels = mockLabels();
        const before = getTransactionSearchIndex([mockTransaction('tx1', 'bc1qalice')], labels);

        const after = getTransactionSearchIndex(
            [mockTransaction('tx1', 'bc1qalice'), mockTransaction('tx2', 'bc1qbob')],
            labels,
        );

        expect(after).not.toBe(before);
        expect(after.txidsByAddress['bc1qbob']).toEqual(new Set(['tx2']));
    });

    it('builds again once the labels are replaced', () => {
        const transactions = [mockTransaction('tx1', 'bc1qalice')];
        const before = getTransactionSearchIndex(transactions, mockLabels());

        expect(getTransactionSearchIndex(transactions, mockLabels())).not.toBe(before);
    });
});
