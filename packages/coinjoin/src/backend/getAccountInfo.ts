import { sortTxsFromLatest } from '@trezor/blockchain-link-utils';
import type { Network } from '@trezor/utxo-lib';

import { CoinjoinAddressController } from './CoinjoinAddressController';
import { isTxConfirmed } from './backendUtils';
import { getAccountUtxo } from './getAccountUtxo';
import type {
    AccountCache,
    AccountInfo,
    Address,
    PrederivedAddress,
    ScanAccountCheckpoint,
    Transaction,
    VinVout,
} from '../types/backend';

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

type AddressStats = { transfers: number; sent: number; received: number };

const getAddressStats = (addresses: PrederivedAddress[], transactions: Transaction[]) => {
    const stats = new Map<string, AddressStats>(
        addresses.map(({ address }) => [address, { transfers: 0, sent: 0, received: 0 }]),
    );

    transactions.forEach(({ details: { vin, vout } }) => {
        const txStats = new Set<AddressStats>();

        const addValues = (vinVouts: VinVout[], field: 'sent' | 'received') =>
            vinVouts.forEach(({ addresses: vinVoutAddresses = [], value }) =>
                vinVoutAddresses.forEach(address => {
                    const addressStats = stats.get(address);
                    if (!addressStats) {
                        return;
                    }

                    addressStats[field] += value ? Number.parseFloat(value) : 0;
                    txStats.add(addressStats);
                }),
            );

        addValues(vin, 'sent');
        addValues(vout, 'received');

        txStats.forEach(addressStats => {
            addressStats.transfers += 1;
        });
    });

    return stats;
};

const enhanceAddress =
    (stats: Map<string, AddressStats>) =>
    ({ address, path }: PrederivedAddress): Address => {
        const { transfers, sent, received } = stats.get(address) ?? {
            transfers: 0,
            sent: 0,
            received: 0,
        };

        return {
            address,
            path,
            transfers,
            balance: (received - sent).toString(),
            sent: sent.toString(),
            received: received.toString(),
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

    const addressStats = getAddressStats(
        addressController.receive.concat(addressController.change),
        txsConfirmed,
    );
    const receive = addressController.receive.map(enhanceAddress(addressStats));
    const change = addressController.change.map(enhanceAddress(addressStats));

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
