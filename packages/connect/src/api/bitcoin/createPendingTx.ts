import type { AccountAddresses, PROTO } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import type { Transaction as BitcoinJsTransaction } from '@trezor/utxo-lib';

import { getSerializedPath } from '../../utils/pathUtils';

export const createPendingTransaction = (
    tx: BitcoinJsTransaction,
    {
        addresses,
        inputs,
        outputs,
    }: {
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
    const allAddresses = addresses.unused.concat(addresses.used, addresses.change);
    const findAddress = ({ address_n }: { address_n?: number[] }) => {
        const path = address_n ? getSerializedPath(address_n) : undefined;

        return allAddresses
            .filter(address => address.path === path)
            .map(address => address.address);
    };

    const vin = inputs.map((ins, n) => {
        const matched = findAddress(ins);
        const hasAddressN = Array.isArray(ins.address_n) && ins.address_n.length > 0;

        // [btc-unknown-tx-debug] address_n on this input did not match any address in
        // account.addresses (unused/used/change). Downstream, blockbookUtils.transformTransaction
        // will not recognize the input as ours, which can cascade to type='unknown' for the
        // optimistic pending tx created right after signing. See addFakePendingTxThunk in
        // suite-common/wallet-core/src/transactions/transactionsThunks.ts.
        // Intentionally no txid / address_n / addresses: these reach Sentry and could deanonymize the user.
        if (hasAddressN && matched.length === 0) {
            console.error(
                '[btc-unknown-tx-debug] createPendingTransaction → input has no matching address',
                {
                    inputIndex: n,
                    knownAddressesCount: allAddresses.length,
                },
            );
        }

        return {
            n,
            txid: ins.prev_hash,
            vout: ins.prev_index,
            isAddress: true,
            addresses: matched,
            value: ins.amount.toString(),
            sequence: ins.sequence,
        };
    });

    return {
        txid: tx.getId(),
        hex: tx.toHex(),
        blockHeight: 0,
        blockTime: Math.floor(Date.now() / 1000),
        confirmations: 0,
        vsize: tx.virtualSize(),
        size: tx.weight(),
        value: valueOut.toString(),
        valueIn: valueIn.toString(),
        fees: valueIn.minus(valueOut).toString(),
        vin,
        vout: outputs.map((out, n) => {
            let transformedAddresses: string[] = [];

            if (out.address) {
                transformedAddresses = [out.address];
            } else if ('op_return_data' in out) {
                transformedAddresses = [
                    `OP_RETURN (${Buffer.from(out.op_return_data, 'hex').toString('ascii')})`,
                ];
            } else {
                transformedAddresses = findAddress(out);
            }

            return {
                n,
                isAddress: out.script_type !== 'PAYTOOPRETURN',
                addresses: transformedAddresses,
                value: out.amount.toString(),
            };
        }),
    };
};
