import { networks } from '@trezor/utxo-lib';

import { CoinjoinMempoolController } from '../../src/backend/CoinjoinMempoolController';
import { MockMempoolClient } from '../mocks/MockMempoolClient';
import { BLOCKS, SEGWIT_RECEIVE_ADDRESSES } from '../fixtures/methods.fixture';

const TXS = BLOCKS.flatMap(block => block.txs); // There is 6 of them
const ADDRESS = SEGWIT_RECEIVE_ADDRESSES[1];
const TXS_MATCH = [TXS[1], TXS[3]];

describe('CoinjoinMempoolController', () => {
    const client = new MockMempoolClient();
    let mempool: CoinjoinMempoolController;

    beforeEach(() => {
        client.clear();
        mempool = new CoinjoinMempoolController({ client, network: networks.regtest });
    });

    it('All at once', async () => {
        await mempool.start();
        TXS.forEach(client.fireTx.bind(client));
        expect(mempool.getTransactions()).toEqual(TXS);
        expect(mempool.getTransactions([ADDRESS])).toEqual(TXS_MATCH);
        await mempool.update(true);
        expect(mempool.getTransactions()).toEqual([]);
    });

    it('Progressing', async () => {
        [TXS[0], TXS[1]].forEach(client.fireTx.bind(client));
        expect(mempool.getTransactions()).toEqual([]);

        await mempool.start();
        [TXS[2], TXS[3]].forEach(client.fireTx.bind(client));
        expect(mempool.getTransactions()).toEqual([TXS[2], TXS[3]]);

        client.setMempoolTxs([TXS[1], TXS[2], TXS[3]]);
        await mempool.update(true);
        expect(mempool.getTransactions()).toEqual([TXS[2], TXS[3]]);

        [TXS[4]].forEach(client.fireTx.bind(client));
        client.setMempoolTxs([TXS[3], TXS[4], TXS[5]]);
        await mempool.update(true);
        expect(mempool.getTransactions()).toEqual([TXS[3], TXS[4]]);

        [TXS[5]].forEach(client.fireTx.bind(client));
        await mempool.update(true);
        expect(mempool.getTransactions()).toEqual([TXS[3], TXS[4], TXS[5]]);

        client.setMempoolTxs([TXS[0], TXS[1]]);
        await mempool.update(true);
        expect(mempool.getTransactions()).toEqual([]);
    });

    it('Filtering', async () => {
        mempool = new CoinjoinMempoolController({
            client,
            network: networks.regtest,
            filter: ({ txid }) =>
                [
                    '22222222222222222222222222222222',
                    '44444444444444444444444444444444',
                    '55555555555555555555555555555555',
                ].includes(txid),
        });
        await mempool.start();
        TXS.forEach(client.fireTx.bind(client));
        expect(mempool.getTransactions()).toEqual([TXS[1], TXS[3], TXS[4]]);
    });
});
