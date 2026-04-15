import { networks } from '@trezor/utxo-lib';

import { CoinjoinMempoolController } from '../../src/backend/CoinjoinMempoolController';
import { AccountAddress } from '../../src/types/backend';
import {
    BLOCKS,
    SEGWIT_CHANGE_ADDRESSES,
    SEGWIT_RECEIVE_ADDRESSES,
} from '../fixtures/methods.fixture';
import { MockMempoolClient } from '../mocks/MockMempoolClient';

type MockTx = (typeof BLOCKS)[number]['txs'][number];
const TXS = BLOCKS.flatMap(block => block.txs); // There is 6 of them
// @ts-expect-error: indexing with noUncheckedIndexedAccess
const ADDRESS: string = SEGWIT_RECEIVE_ADDRESSES[1];
// @ts-expect-error: indexing with noUncheckedIndexedAccess
const [TX0, TX1, TX2, TX3, TX4, TX5]: [MockTx, MockTx, MockTx, MockTx, MockTx, MockTx] = TXS;
const TXS_MATCH = [TX1, TX3];

describe('CoinjoinMempoolController', () => {
    const client = new MockMempoolClient();
    let mempool: CoinjoinMempoolController;

    beforeEach(() => {
        client.clear();
        mempool = new CoinjoinMempoolController({ client, network: networks.regtest });
    });

    it('All at once', async () => {
        client.setMempoolTxs(TXS);
        await mempool.init();
        expect(mempool.getTransactions()).toEqual(TXS);
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
        client.setMempoolTxs(TXS);
        await mempool.init();
        expect(mempool.getTransactions()).toEqual([TX1, TX3, TX4]);
    });

    it('Removing', async () => {
        client.setMempoolTxs(TXS);
        await mempool.init();
        expect(mempool.getTransactions()).toEqual(TXS);

        mempool.removeTransactions([TX0.txid, TX2.txid, 'unknown', TX4.txid]);
        expect(mempool.getTransactions()).toEqual([TX1, TX3, TX5]);
    });

    it('Replace-by-fee', async () => {
        const outpointCollision = { txid: 'foo', vout: 3 };
        const a1 = TX1;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const a1Vin0: (typeof a1.vin)[number] = a1.vin[0];
        a1.vin[0] = { ...a1Vin0, ...outpointCollision };
        const b = TX2;
        const a2 = TX4;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const a2Vin1: (typeof a2.vin)[number] = a2.vin[1];
        a2.vin[1] = { ...a2Vin1, ...outpointCollision };

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
