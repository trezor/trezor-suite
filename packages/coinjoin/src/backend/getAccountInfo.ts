import type { Network } from '@trezor/utxo-lib';
import { sortTxsFromLatest } from '@trezor/blockchain-link-utils';
import { sumAddressValues } from '@trezor/blockchain-link/lib/workers/electrum/methods/getAccountInfo';

import { isTxConfirmed, doesTxContainAddress } from './backendUtils';
import type {
    Transaction,
    AccountInfo,
    ScanAccountCheckpoint,
    PrederivedAddress,
    AccountCache,
} from '../types/backend';
import { getAccountUtxo } from './getAccountUtxo';
import { CoinjoinAddressController } from './CoinjoinAddressController';

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

const enhanceAddress =
    (transactions: Transaction[]) =>
    ({ address, path }: PrederivedAddress) => {
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
    };

type GetAccountInfoParams = {
    descriptor: string;
    transactions: Transaction[];
    network: Network;
    checkpoint: ScanAccountCheckpoint;
    cache?: AccountCache;
};

export const getAccountInfo = (params: GetAccountInfoParams): AccountInfo => {
    const { descriptor, transactions, network } = params;
    const txCountTotal = transactions.length;
    const balanceTotal = transactions.reduce(sumBalance, 0);

    const txsConfirmed = transactions.filter(isTxConfirmed);
    const txCountConfirmed = txsConfirmed.length;
    const balanceConfirmed = txsConfirmed.reduce(sumBalance, 0);

    const txsFromLatest = sortTxsFromLatest(transactions);
    const txsFromOldest = txsFromLatest.slice().reverse();

    const addressController = new CoinjoinAddressController(
        descriptor,
        network,
        params.checkpoint,
        params.cache,
    );

    const receive = addressController.receive.map(enhanceAddress(txsConfirmed));
    const change = addressController.change.map(enhanceAddress(txsConfirmed));

    const addresses = {
        change,
        unused: receive.filter(({ transfers }) => !transfers),
        used: receive.filter(({ transfers }) => transfers),
    };

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
        page: getPagination(transactions.length),
        addresses,
        utxo: getAccountUtxo({ transactions: txsFromOldest, addresses }),
    };
};
