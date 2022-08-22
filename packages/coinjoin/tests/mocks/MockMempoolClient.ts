import type { BlockbookTransaction, MempoolClient } from '../../src/types/backend';

type MockTx = Pick<BlockbookTransaction, 'txid' | 'vin' | 'vout'>;

export class MockMempoolClient implements MempoolClient {
    private transactions: MockTx[] = [];
    fetched: string[] = [];

    setFixture(fixture: MockTx[]) {
        this.transactions = fixture;
        this.fetched = [];
    }

    fetchMempoolTxids() {
        return Promise.resolve(this.transactions.map(tx => tx.txid));
    }

    fetchTransaction(txid: string) {
        this.fetched.push(txid);
        const tx = this.transactions.find(t => t.txid === txid);
        return tx ? Promise.resolve(tx as BlockbookTransaction) : Promise.reject();
    }
}
