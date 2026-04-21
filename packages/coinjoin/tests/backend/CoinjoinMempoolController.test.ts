import { networks } from '@trezor/utxo-lib';

import { CoinjoinMempoolController } from '../../src/backend/CoinjoinMempoolController';
import { AccountAddress } from '../../src/types/backend';
import {
    BLOCK_TXS,
    SEGWIT_CHANGE_ADDRESSES,
    SEGWIT_RECEIVE_ADDRESSES,
    TX0,
    TX1,
    TX2,
    TX3,
    TX4,
    TX5,
} from '../fixtures/methods.fixture';
import { MockMempoolClient } from '../mocks/MockMempoolClient';

const ADDRESS = SEGWIT_RECEIVE_ADDRESSES[1];
const TXS_MATCH = [TX1, TX3];

describe('CoinjoinMempoolController', () => {
    const client = new MockMempoolClient();
    let mempool: CoinjoinMempoolController;

    beforeEach(() => {
        client.clear();
        mempool = new CoinjoinMempoolController({ client, network: networks.regtest });
    });

    it('All at once', async () => {
        client.setMempoolTxs(BLOCK_TXS);
        await mempool.init();
        expect(mempool.getTransactions()).toEqual(BLOCK_TXS);
        expect(
            mempool.getTransactions({
                receive: [{ address: ADDRESS } as AccountAddress],
                change: [],
                analyze: (getTxs, onTxs) => {
                    const txs = getTxs({ address: ADDRESS } as AccountAddress);
                    onTxs?.(txs);

                    return { receive: [], change: [] };
                },
            }),
        ).toEqual(TXS_MATCH);
        client.setMempoolTxs([]);
        await mempool.update(true);
        expect(mempool.getTransactions()).toEqual([]);
    });

    it('Progressing', async () => {
        [TX0, TX1].forEach(client.fireTx.bind(client));
        expect(mempool.getTransactions()).toEqual([]);

        await mempool.start();
        [TX2, TX3].forEach(client.fireTx.bind(client));
        expect(mempool.getTransactions()).toEqual([TX2, TX3]);

        client.setMempoolTxs([TX1, TX2, TX3]);
        await mempool.update(true);
        expect(mempool.getTransactions()).toEqual([TX2, TX3]);

        [TX4].forEach(client.fireTx.bind(client));
        client.setMempoolTxs([TX3, TX4, TX5]);
        await mempool.update(true);
        expect(mempool.getTransactions()).toEqual([TX3, TX4]);

        [TX5].forEach(client.fireTx.bind(client));
        await mempool.update(true);
        expect(mempool.getTransactions()).toEqual([TX3, TX4, TX5]);

        client.setMempoolTxs([TX0, TX1]);
        await mempool.update(true);
        expect(mempool.getTransactions()).toEqual([]);
    });

    it('Filtering', async () => {
        mempool = new CoinjoinMempoolController({
            client,
            network: networks.regtest,
            filter: address =>
                address === SEGWIT_RECEIVE_ADDRESSES[1] || address === SEGWIT_CHANGE_ADDRESSES[0],
        });
        client.setMempoolTxs(BLOCK_TXS);
        await mempool.init();
        expect(mempool.getTransactions()).toEqual([TX1, TX3, TX4]);
    });

    it('Removing', async () => {
        client.setMempoolTxs(BLOCK_TXS);
        await mempool.init();
        expect(mempool.getTransactions()).toEqual(BLOCK_TXS);

        mempool.removeTransactions([TX0.txid, TX2.txid, 'unknown', TX4.txid]);
        expect(mempool.getTransactions()).toEqual([TX1, TX3, TX5]);
    });

    it('Replace-by-fee', async () => {
        const outpointCollision = { txid: 'foo', vout: 3 };
        const a1 = TX1;
        a1.vin[0] = { ...a1.vin[0], ...outpointCollision };
        const b = TX2;
        const a2 = TX4;
        a2.vin[1] = { ...a2.vin[1], ...outpointCollision };

        client.setMempoolTxs([a1]);
        await mempool.start();
        await mempool.init();
        expect(mempool.getTransactions()).toEqual([a1]);
        client.fireTx(b);
        expect(mempool.getTransactions()).toEqual([a1, b]);
        client.fireTx(a2);
        expect(mempool.getTransactions()).toEqual([b, a2]);
    });
});
