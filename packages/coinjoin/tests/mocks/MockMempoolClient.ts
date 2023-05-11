import type { BlockbookTransaction, MempoolClient } from '../../src/types/backend';

type MockTx = Pick<BlockbookTransaction, 'txid' | 'vin' | 'vout'>;

export class MockMempoolClient implements MempoolClient {
    private mempoolTxids: string[] = [];

    clear() {
        this.mempoolTxids = [];
        this.listener = undefined;
    }

    setMempoolTxs(txs: MockTx[]) {
        this.mempoolTxids = txs.map(tx => tx.txid);
    }

    fireTx(tx: MockTx) {
        this.listener?.(tx as BlockbookTransaction);
    }

    fetchMempoolFilters() {
        return Promise.resolve(Object.fromEntries(this.mempoolTxids.map(txid => [txid, ''])));
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
