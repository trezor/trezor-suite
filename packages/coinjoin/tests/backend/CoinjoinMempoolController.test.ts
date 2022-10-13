import { CoinjoinMempoolController } from '../../src/backend/CoinjoinMempoolController';
import { MockMempoolClient } from '../mocks/MockMempoolClient';
import { BLOCKS, SEGWIT_RECEIVE_ADDRESSES } from '../fixtures/methods.fixture';

const TXS = BLOCKS.flatMap(block => block.txs);
const ADDRESS = SEGWIT_RECEIVE_ADDRESSES[1];
const TXS_MATCH = [TXS[1], TXS[3]];

describe('CoinjoinMempoolController', () => {
    const client = new MockMempoolClient();
    let mempool: CoinjoinMempoolController;

    beforeEach(() => {
        mempool = new CoinjoinMempoolController(client);
    });

    it('All at once', async () => {
        client.setFixture(TXS);
        await mempool.update();
        const received = mempool.getTransactions([ADDRESS]);
        expect(received).toEqual(TXS_MATCH);
        expect(client.fetched).toEqual(TXS.map(({ txid }) => txid));
    });

    it('Progressing', async () => {
        client.setFixture(TXS.slice(0, 3));
        const start = mempool.getTransactions([ADDRESS]);
        expect(start).toEqual([]);
        expect(client.fetched).toEqual([]);

        await mempool.update();
        const mid = mempool.getTransactions([ADDRESS]);
        expect(mid).toEqual(TXS_MATCH.slice(0, 1));
        expect(client.fetched).toEqual(TXS.slice(0, 3).map(({ txid }) => txid));

        client.setFixture(TXS);
        await mempool.update();
        const end = mempool.getTransactions([ADDRESS]);
        expect(end).toEqual(TXS_MATCH);
        expect(client.fetched).toEqual(TXS.slice(3).map(({ txid }) => txid));
    });
});
