import type { ElectrumAPI, ElectrumHistoryTx, ElectrumTypes } from '@trezor/blockchain-link-types';
import { networks } from '@trezor/utxo-lib';

import { getTransactions } from './transaction';

type TransactionVerbose = ElectrumTypes.TransactionVerbose;
type TxOut = ElectrumTypes.TxOut;

const INFO: ElectrumTypes.Info = {
    url: '127.0.0.1:50001:t',
    coin: 'Regtest',
    network: networks.regtest,
    version: ['ElectrumX', '1.4'],
    block: { height: 10, hex: '' },
};

const out = (n: number, value: number, address: string): TxOut => ({
    n,
    value,
    scriptPubKey: { asm: '', hex: `00${n}`, address, type: 'witness_v0_keyhash' },
});
const tx = (
    txid: string,
    vin: { txid: string; vout: number }[],
    vout: TxOut[],
): TransactionVerbose => ({
    txid,
    hash: txid,
    hex: '',
    blockhash: 'block',
    version: 2,
    size: 100,
    vsize: 100,
    weight: 400,
    locktime: 0,
    confirmations: 1,
    time: 0,
    blocktime: 0,
    vin: vin.map(input => ({ ...input, sequence: 0, scriptSig: {}, txinwitness: [] })),
    vout,
});

const TXS: Record<string, TransactionVerbose> = {
    prev: tx('prev', [], [out(0, 1, 'A'), out(1, 2, 'B')]),
    t1: tx('t1', [{ txid: 'prev', vout: 0 }], [out(0, 0.5, 'C')]),
    t2: tx(
        't2',
        [
            { txid: 'prev', vout: 1 },
            { txid: 't1', vout: 0 },
        ],
        [out(0, 2.4, 'D')],
    ),
};

describe('electrum getTransactions', () => {
    it('fetches every transaction once, in first-seen order', async () => {
        const request = jest.fn((_method: string, txid: string) => Promise.resolve(TXS[txid]));
        const client: Partial<ElectrumAPI> = {
            getInfo: () => INFO,
            // the stub serves only the verbose `blockchain.transaction.get` overload
            request: request as unknown as ElectrumAPI['request'],
        };
        // the histories of several addresses, concatenated: t1 touches two of them
        const history: ElectrumHistoryTx[] = [
            { tx_hash: 't1', height: 10 },
            { tx_hash: 't2', height: 10 },
            { tx_hash: 't1', height: 10 },
        ];

        const result = await getTransactions(client as ElectrumAPI, history);

        expect(request.mock.calls.map(([, txid]) => txid)).toEqual(['t1', 't2', 'prev']);
        expect(result.map(({ txid, valueIn, value }) => ({ txid, valueIn, value }))).toEqual([
            { txid: 't1', valueIn: '100000000', value: '50000000' },
            { txid: 't2', valueIn: '250000000', value: '240000000' },
        ]);
    });
});
