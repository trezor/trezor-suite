import { networks } from '@trezor/utxo-lib';

import { getAccountInfo } from './getAccountInfo';
import {
    SEGWIT_CHANGE_ADDRESSES,
    SEGWIT_RECEIVE_ADDRESSES,
    SEGWIT_XPUB,
} from '../__fixtures__/methods.fixture';
import type { EnhancedVinVout, ScanAccountCheckpoint, Transaction } from '../types/backend';

const [RECEIVE_0, RECEIVE_1, RECEIVE_2] = SEGWIT_RECEIVE_ADDRESSES as [string, string, string];
const [CHANGE_0] = SEGWIT_CHANGE_ADDRESSES as [string];
const FOREIGN = 'bcrt1qforeignaddressforeignaddressforeign0';

const CHECKPOINT: ScanAccountCheckpoint = {
    blockHash: 'blockhash',
    blockHeight: 3,
    receiveCount: SEGWIT_RECEIVE_ADDRESSES.length,
    changeCount: SEGWIT_CHANGE_ADDRESSES.length,
};

type VinVoutParams = {
    n: number;
    address: string;
    value: string;
    txid?: string;
    vout?: number;
};

const createVinVout = ({ n, address, value, txid, vout }: VinVoutParams): EnhancedVinVout => ({
    n,
    txid,
    vout,
    addresses: [address],
    isAddress: true,
    isAccountOwned: address !== FOREIGN,
    value,
});

type TxParams = {
    txid: string;
    blockHeight?: number;
    type: Transaction['type'];
    amount: string;
    vin: VinVoutParams[];
    vout: VinVoutParams[];
};

const createTx = ({ txid, blockHeight, type, amount, vin, vout }: TxParams): Transaction => ({
    type,
    txid,
    blockHeight,
    blockTime: blockHeight,
    amount,
    fee: '0',
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: {
        vin: vin.map(createVinVout),
        vout: vout.map(createVinVout),
        size: 0,
        totalInput: '0',
        totalOutput: '0',
    },
});

const TX_A = createTx({
    txid: 'aa',
    blockHeight: 1,
    type: 'recv',
    amount: '3000',
    vin: [{ n: 0, address: FOREIGN, value: '10000', txid: 'ff', vout: 0 }],
    vout: [
        { n: 0, address: RECEIVE_0, value: '1000' },
        { n: 1, address: CHANGE_0, value: '2000' },
        { n: 2, address: FOREIGN, value: '6000' },
    ],
});

const TX_B = createTx({
    txid: 'bb',
    blockHeight: 2,
    type: 'sent',
    amount: '50',
    vin: [{ n: 0, address: RECEIVE_0, value: '1000', txid: 'aa', vout: 0 }],
    vout: [
        { n: 0, address: RECEIVE_1, value: '900' },
        { n: 1, address: FOREIGN, value: '50' },
    ],
});

const TX_C = createTx({
    txid: 'cc',
    blockHeight: 3,
    type: 'sent',
    amount: '400',
    vin: [{ n: 0, address: CHANGE_0, value: '2000', txid: 'aa', vout: 1 }],
    vout: [
        { n: 0, address: CHANGE_0, value: '1500' },
        { n: 1, address: FOREIGN, value: '400' },
    ],
});

const TX_PENDING = createTx({
    txid: 'dd',
    type: 'recv',
    amount: '700',
    vin: [{ n: 0, address: FOREIGN, value: '800', txid: 'ee', vout: 0 }],
    vout: [
        { n: 0, address: RECEIVE_2, value: '700' },
        { n: 1, address: FOREIGN, value: '100' },
    ],
});

const getInfo = (transactions: Transaction[]) =>
    getAccountInfo({
        descriptor: SEGWIT_XPUB,
        network: networks.regtest,
        transactions,
        checkpoint: CHECKPOINT,
    });

const findAddress = (info: ReturnType<typeof getInfo>, address: string) =>
    [...info.addresses.used, ...info.addresses.unused, ...info.addresses.change].find(
        entry => entry.address === address,
    );

describe('getAccountInfo', () => {
    it('counts a tx once for an address present in both its inputs and outputs', () => {
        const info = getInfo([TX_A, TX_B, TX_C]);

        expect(findAddress(info, CHANGE_0)).toMatchObject({
            transfers: 2,
            sent: '2000',
            received: '3500',
            balance: '1500',
        });
    });

    it('sums values of an address across all its txs and ignores foreign addresses', () => {
        const info = getInfo([TX_A, TX_B, TX_C]);

        expect(findAddress(info, RECEIVE_0)).toMatchObject({
            transfers: 2,
            sent: '1000',
            received: '1000',
            balance: '0',
        });
        expect(findAddress(info, RECEIVE_1)).toMatchObject({
            transfers: 1,
            sent: '0',
            received: '900',
            balance: '900',
        });
    });

    it('splits receive addresses into used and unused', () => {
        const info = getInfo([TX_A, TX_B, TX_C]);

        expect(info.addresses.used.map(({ address }) => address)).toEqual([RECEIVE_0, RECEIVE_1]);
        expect(info.addresses.unused).toHaveLength(SEGWIT_RECEIVE_ADDRESSES.length - 2);
        expect(findAddress(info, RECEIVE_2)).toMatchObject({
            transfers: 0,
            sent: '0',
            received: '0',
            balance: '0',
        });
    });

    it('excludes pending txs from address stats but includes them in available balance', () => {
        const confirmedInfo = getInfo([TX_A, TX_B, TX_C]);
        const info = getInfo([TX_A, TX_B, TX_C, TX_PENDING]);

        expect(findAddress(info, RECEIVE_2)).toMatchObject({ transfers: 0, received: '0' });
        expect(info.addresses.used).toEqual(confirmedInfo.addresses.used);
        expect(info.history.unconfirmed).toBe(1);
        expect(info.balance).toBe(confirmedInfo.balance);
        expect(Number(info.availableBalance) - Number(info.balance)).toBe(700);
    });

    it('assigns derivation paths to unspent outputs of receive, change and unused addresses', () => {
        const info = getInfo([TX_A, TX_B, TX_C, TX_PENDING]);

        expect(info.utxo).toHaveLength(3);
        expect(info.utxo).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    txid: 'bb',
                    address: RECEIVE_1,
                    path: "m/84'/1'/0'/0/1",
                }),
                expect.objectContaining({ txid: 'cc', address: CHANGE_0, path: "m/84'/1'/0'/1/0" }),
                expect.objectContaining({
                    txid: 'dd',
                    address: RECEIVE_2,
                    path: "m/84'/1'/0'/0/2",
                }),
            ]),
        );
    });
});
