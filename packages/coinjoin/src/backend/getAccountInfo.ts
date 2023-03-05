import type { Network } from '@trezor/utxo-lib';
import { sortTxsFromLatest } from '@trezor/blockchain-link-utils';
import { sumAddressValues } from '@trezor/blockchain-link/lib/workers/electrum/methods/getAccountInfo';

import { isTxConfirmed, doesTxContainAddress, deriveAddresses } from './backendUtils';
import type {
    Transaction,
    AddressInfo,
    AccountInfo,
    ScanAccountCheckpoint,
    Address,
    PrederivedAddress,
    AccountCache,
} from '../types/backend';
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
    prederived: PrederivedAddress[] | undefined,
    network: Network,
    transactions: Transaction[],
): Address[] =>
    deriveAddresses(prederived, descriptor, type, 0, count, network).map(({ address, path }) => {
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

type GetAddressInfoParams = {
    descriptor: string;
    transactions: Transaction[];
    network: Network;
};

type GetAccountInfoParams = GetAddressInfoParams & {
    checkpoint: ScanAccountCheckpoint;
    cache?: AccountCache;
};

type GetAccountInfo = {
    (params: GetAccountInfoParams): AccountInfo;
    (params: GetAddressInfoParams): AddressInfo;
};

export const getAccountInfo: GetAccountInfo = params => {
    const { descriptor, transactions, network } = params;
    const txCountTotal = transactions.length;
    const balanceTotal = transactions.reduce(sumBalance, 0);

    const txsConfirmed = transactions.filter(isTxConfirmed);
    const txCountConfirmed = txsConfirmed.length;
    const balanceConfirmed = txsConfirmed.reduce(sumBalance, 0);

    const txsFromLatest = sortTxsFromLatest(transactions);
    const txsFromOldest = txsFromLatest.slice().reverse();

    const commonInfo = {
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
    };

    if ('checkpoint' in params) {
        const receive = deriveTxAddresses(
            descriptor,
            'receive',
            params.checkpoint.receiveCount,
            params.cache?.receivePrederived,
            network,
            txsConfirmed,
        );
        const change = deriveTxAddresses(
            descriptor,
            'change',
            params.checkpoint.changeCount,
            params.cache?.changePrederived,
            network,
            txsConfirmed,
        );
        const addresses = {
            change,
            unused: receive.filter(({ transfers }) => !transfers),
            used: receive.filter(({ transfers }) => transfers),
        };
        return {
            ...commonInfo,
            addresses,
            utxo: getAccountUtxo({ transactions: txsFromOldest, addresses }),
        };
    }
    return {
        ...commonInfo,
        utxo: getAccountUtxo({ transactions: txsFromOldest }),
    } as AccountInfo;
};
