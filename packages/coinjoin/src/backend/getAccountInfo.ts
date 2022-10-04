import { Network, deriveAddresses } from '@trezor/utxo-lib';
import {
    sumAddressValues,
    sortTxsFromLatest,
} from '@trezor/blockchain-link/lib/workers/electrum/methods/getAccountInfo';

// import { getAddressScript } from './filters';
// import { analyzeTransactions } from '../client/middleware';
import { isTxConfirmed, doesTxContainAddress } from './utils';
import type { Transaction, AccountInfo, ScanAccountCheckpoint, Address } from './types';
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

export interface AddressesWithAnonymity extends NonNullable<AccountInfo['addresses']> {
    anonymitySet: Record<string, number | undefined>; // key -> address, value -> anonymity
}

export const getAccountInfo = async ({
    descriptor,
    transactions,
    checkpoint,
    network,
}: {
    descriptor: string;
    transactions: Transaction[];
    checkpoint?: ScanAccountCheckpoint;
    network: Network;
}): Promise<AccountInfo> => {
    const txCountTotal = transactions.length;
    const balanceTotal = transactions.reduce(sumBalance, 0);

    const txsConfirmed = transactions.filter(isTxConfirmed);
    const txCountConfirmed = txsConfirmed.length;
    const balanceConfirmed = txsConfirmed.reduce(sumBalance, 0);

    let addresses: AddressesWithAnonymity | undefined;
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
            anonymitySet: {},
        };
    }

    // store map of [addressScript]: address
    // const addressesMap: Record<string, string | undefined> = {};
    // const analyzeAnonymityParams = transactions.map(tx => {
    //     const internalInputs: any[] = [];
    //     const externalInputs: any[] = [];
    //     tx.details.vin.forEach(vin => {
    //         const address = vin.addresses!.join('');
    //         const publicKey = getAddressScript(address, network).toString('hex');
    //         const value = Number(vin.value);
    //         addressesMap[publicKey] = address;
    //         const input = {
    //             publicKey,
    //             value,
    //         };
    //         if (vin.isAccountOwned) internalInputs.push(input);
    //         else externalInputs.push(input);
    //     });

    //     const internalOutputs: any[] = [];
    //     const externalOutputs: any[] = [];
    //     tx.details.vout.forEach(vout => {
    //         const address = vout.addresses!.join('');
    //         const publicKey = getAddressScript(address, network).toString('hex');
    //         const value = Number(vout.value);
    //         addressesMap[publicKey] = address;
    //         const output = {
    //             publicKey,
    //             scriptPubKey: publicKey,
    //             value,
    //         };
    //         if (vout.isAccountOwned) internalOutputs.push(output);
    //         else externalOutputs.push(output);
    //     });

    //     return {
    //         internalInputs,
    //         internalOutputs,
    //         externalInputs,
    //         externalOutputs,
    //     };
    // });

    // console.warn('CALC ANON', analyzeAnonymityParams);

    // // call middleware
    // const anonymity: any[] = [];
    // try {
    //     const result = await analyzeTransactions(analyzeAnonymityParams, {
    //         baseUrl: 'http://localhost:8081/Cryptography/',
    //     });

    //     result.forEach(r => anonymity.push(r));
    // } catch (error) {
    //     console.warn('ANON err', error);
    // }

    // if (addresses) {
    //     addresses.anonymitySet = anonymity.reduce((obj, a) => {
    //         const address = addressesMap[a.pubKey];
    //         if (address) {
    //             obj[address] = a.anonymitySet;
    //         } else {
    //             obj[a.pubKey] = a.anonymitySet;
    //         }
    //         return obj;
    //     }, {} as Record<string, number>);
    // }

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
