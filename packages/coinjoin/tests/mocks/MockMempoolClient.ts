import type { BlockbookTransaction, MempoolClient } from '../../src/types/backend';

type MockTx = Pick<BlockbookTransaction, 'txid' | 'vin' | 'vout'> & { filter: string };

export class MockMempoolClient implements MempoolClient {
    private mempoolTxs: MockTx[] = [];

    clear() {
        this.mempoolTxs = [];
        this.listener = undefined;
    }

    setMempoolTxs(txs: MockTx[]) {
        this.mempoolTxs = txs;
    }

    fireTx(tx: MockTx) {
        this.listener?.(tx as unknown as BlockbookTransaction);
    }

    fetchMempoolFilters() {
        return Promise.resolve(
            Object.fromEntries(this.mempoolTxs.map(({ txid, filter }) => [txid, filter])),
        );
    }

    fetchTransaction() {
        return Promise.reject();
    }

    private listener?: (tx: BlockbookTransaction) => void;

    subscribeMempoolTxs(listener: (tx: BlockbookTransaction) => void) {
        this.listener = listener;
        return Promise.resolve();
    }

    unsubscribeMempoolTxs(_listener: (tx: BlockbookTransaction) => void) {
        this.listener = undefined;
        return Promise.resolve();
    }
}
