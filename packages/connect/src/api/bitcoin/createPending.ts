import BigNumber from 'bignumber.js';

import { Transaction as BitcoinJsTransaction } from '@trezor/utxo-lib';
import { getSerializedPath } from '../../utils/pathUtils';
import { PROTO } from '../../constants';

import type { AccountAddresses, AccountUtxo } from '../../types';

export const createPendingTransaction = (
    tx: BitcoinJsTransaction,
    {
        utxo,
        addresses,
        inputs,
        outputs,
    }: {
        utxo: AccountUtxo[];
        addresses: AccountAddresses;
        inputs: PROTO.TxInputType[];
        outputs: PROTO.TxOutputType[];
    },
) => {
    const valueOut = outputs.reduce(
        (sum, out) => BigNumber(sum).plus(out.amount),
        new BigNumber('0'),
    );
    const valueIn = inputs.reduce(
        (sum, ins) => BigNumber(sum).plus(ins.amount),
        new BigNumber('0'),
    );
    return {
        hex: tx.toHex(),
        blockHeight: -1,
        blockTime: Math.floor(Date.now() / 1000),
        confirmations: 0,
        vsize: tx.virtualSize(),
        size: tx.weight(),
        value: valueOut.toString(),
        valueIn: valueIn.toString(),
        fees: valueIn.minus(valueOut).toString(),
        vin: inputs.map((ins, n) => ({
            n,
            txid: ins.prev_hash,
            vout: ins.prev_index,
            isAddress: true,
            addresses: utxo!
                .filter(utxo => utxo.txid + utxo.vout === ins.prev_hash + ins.prev_index)
                .map(utxo => utxo.address),
            value: ins.amount.toString(),
        })),
        vout: outputs.map((out, n) => ({
            n,
            isAddress: out.script_type !== 'PAYTOOPRETURN',
            addresses: out.address
                ? [out.address]
                : [...addresses!.change, ...addresses!.unused, ...addresses!.used]
                      .filter(address => address.path === getSerializedPath(out.address_n!))
                      .map(address => address.address), // todo:
            value: out.amount.toString(),
        })),
    };
};
