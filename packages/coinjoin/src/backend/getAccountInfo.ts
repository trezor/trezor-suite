import { Network, deriveAddresses } from '@trezor/utxo-lib';
import {
    sumAddressValues,
    sortTxsFromLatest,
} from '@trezor/blockchain-link/lib/workers/electrum/methods/getAccountInfo';

import { isTxConfirmed, doesTxContainAddress } from './backendUtils';
import type { Transaction, AccountInfo, ScanAccountCheckpoint, Address } from '../types/backend';
import { getAccountUtxo } from './getAccountUtxo';

const PAGE_SIZE_DEFAULT = 25;

const getPagination = (txCount: number, perPage = PAGE_SIZE_DEFAULT) => ({
    index: 1,
    size: perPage,
    total: Math.ceil(txCount / perPage),
});

const getDelta = ({ type, amount, fee }: Transaction) => {
    switch (type) {
        case 'recv':
        case 'joint':
            return Number.parseInt(amount, 10);
        case 'sent':
            return -(Number.parseInt(amount, 10) + Number.parseInt(fee, 10));
        case 'self':
            return -Number.parseInt(amount, 10);
        default:
            return 0;
    }
};

const sumBalance = (current: number, tx: Transaction) => current + getDelta(tx);

const deriveTxAddresses = (
    descriptor: string,
    type: 'receive' | 'change',
    count: number,
    network: Network,
    transactions: Transaction[],
): Address[] =>
    deriveAddresses(descriptor, type, 0, count, network).map(({ address, path }) => {
        const txs = transactions.filter(tx => doesTxContainAddress(address)(tx.details));
        const sent = sumAddressValues(txs, address, tx => tx.details.vin);
        const received = sumAddressValues(txs, address, tx => tx.details.vout);
        return {
            address,
            path,
            transfers: txs.length,
            balance: txs.length ? (received - sent).toString() : undefined,
            sent: txs.length ? sent.toString() : undefined,
            received: txs.length ? received.toString() : undefined,
        };
    });

export const getAccountInfo = ({
    descriptor,
    transactions,
    checkpoint,
    network,
}: {
    descriptor: string;
    transactions: Transaction[];
    checkpoint?: ScanAccountCheckpoint;
    network: Network;
}): AccountInfo => {
    const txCountTotal = transactions.length;
    const balanceTotal = transactions.reduce(sumBalance, 0);

    const txsConfirmed = transactions.filter(isTxConfirmed);
    const txCountConfirmed = txsConfirmed.length;
    const balanceConfirmed = txsConfirmed.reduce(sumBalance, 0);

    let addresses;
    if (checkpoint) {
        const receive = deriveTxAddresses(
            descriptor,
            'receive',
            checkpoint.receiveCount,
            network,
            txsConfirmed,
        );
        const change = deriveTxAddresses(
            descriptor,
            'change',
            checkpoint.changeCount,
            network,
            txsConfirmed,
        );
        addresses = {
            change,
            unused: receive.filter(({ transfers }) => !transfers),
            used: receive.filter(({ transfers }) => transfers),
        };
    }

    const txsFromLatest = transactions.slice().sort(sortTxsFromLatest);
    const txsFromOldest = txsFromLatest.slice().reverse();

    return {
        descriptor,
        balance: balanceConfirmed.toString(),
        availableBalance: balanceTotal.toString(),
        empty: !txCountTotal,
        history: {
            total: txCountConfirmed,
            unconfirmed: txCountTotal - txCountConfirmed,
            transactions: txsFromLatest,
        },
        addresses,
        page: getPagination(transactions.length),
        utxo: getAccountUtxo({
            transactions: txsFromOldest,
            addresses,
        }),
    };
};
