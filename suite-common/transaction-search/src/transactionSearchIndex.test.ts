import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type SearchAccountLabels } from './searchLabels';
import { getLabelSearchLookups, getTransactionSearchLookups } from './transactionSearchIndex';

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

describe('getTransactionSearchLookups', () => {
    it('finds every transaction that used an address', () => {
        const first = mockTransaction('tx1', 'bc1qalice');
        const second = mockTransaction('tx2', 'bc1qbob');

        const { byAddress } = getTransactionSearchLookups([first, second]);

        expect(byAddress.get('bc1qalice')?.ids).toEqual(['tx1']);
        expect(byAddress.get('bc1qalice')?.entities).toEqual([first]);
        expect(byAddress.get('bc1qbob')?.ids).toEqual(['tx2']);
    });

    it('gets back to a transaction from its txid', () => {
        const transaction = mockTransaction('tx1', 'bc1qalice');

        expect(getTransactionSearchLookups([transaction]).transactionsByTxid.get('tx1')).toBe(
            transaction,
        );
    });

    it('knows where a transaction sits among the others', () => {
        const { positionByTxid } = getTransactionSearchLookups([
            mockTransaction('tx1', 'bc1qalice'),
            mockTransaction('tx2', 'bc1qbob'),
        ]);

        expect(positionByTxid.get('tx1')).toBe(0);
        expect(positionByTxid.get('tx2')).toBe(1);
    });

    it('leaves out the holes a not-yet-fetched page left', () => {
        const sparse: WalletAccountTransaction[] = [];
        sparse[0] = mockTransaction('tx1', 'bc1qalice');
        sparse[3] = mockTransaction('tx2', 'bc1qbob');

        const { positionByTxid, transactionsByTxid } = getTransactionSearchLookups(sparse);

        expect(transactionsByTxid.size).toBe(2);
        // Positions among the transactions that are there, which is all an order needs to be.
        expect(positionByTxid.get('tx2')).toBe(1);
    });

    it('builds once for the same transactions', () => {
        // The reason this exists. Typing hands over the same array on every keystroke, and an
        // advanced query hands it over once per `&`/`|` term; without this, each of those walked
        // every input, output and target again.
        const transactions = [mockTransaction('tx1', 'bc1qalice')];

        expect(getTransactionSearchLookups(transactions).byAddress).toBe(
            getTransactionSearchLookups(transactions).byAddress,
        );
    });

    it('builds again once the transactions are replaced', () => {
        const before = getTransactionSearchLookups([mockTransaction('tx1', 'bc1qalice')]);

        const after = getTransactionSearchLookups([
            mockTransaction('tx1', 'bc1qalice'),
            mockTransaction('tx2', 'bc1qbob'),
        ]);

        expect(after.byAddress).not.toBe(before.byAddress);
        expect(after.byAddress.get('bc1qbob')?.ids).toEqual(['tx2']);
    });
});

describe('getLabelSearchLookups', () => {
    it('turns the output labels inside out', () => {
        expect(getLabelSearchLookups(mockLabels()).txidsByOutputLabel.get('rent')).toEqual(['tx1']);
    });

    it('turns the address labels inside out', () => {
        expect(getLabelSearchLookups(mockLabels()).addressesByLabel.get('alice')).toEqual([
            'bc1qalice',
        ]);
    });

    it('builds once for the same labels', () => {
        const labels = mockLabels();

        expect(getLabelSearchLookups(labels)).toBe(getLabelSearchLookups(labels));
    });

    it('builds again once the labels are replaced', () => {
        // And is not invalidated by the transactions changing, which it has nothing to do with.
        expect(getLabelSearchLookups(mockLabels())).not.toBe(getLabelSearchLookups(mockLabels()));
    });
});
