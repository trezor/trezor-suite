import { Utxo } from '@trezor/blockchain-link';

import {
    FilterAndCategorizeUtxosParams,
    FilterAndCategorizeUtxosResult,
} from '../filterAndCategorizeUtxos';

export const baseUtxo: Omit<Utxo, 'address'> = {
    txid: '1',
    vout: 1,
    amount: '100',
    blockHeight: 100,
    path: 'string',
    confirmations: 100,
};

type FilterAndCategorize = {
    params: FilterAndCategorizeUtxosParams;
    checkResult: (result: FilterAndCategorizeUtxosResult) => boolean;
};

const filterByAddress: FilterAndCategorize[] = [
    {
        params: {
            searchQuery: 'one',
            utxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                },
                {
                    address: 'two',
                    ...baseUtxo,
                },
                {
                    address: 'three',
                    ...baseUtxo,
                },
            ],
            spendableUtxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                },
            ],
            lowAnonymityUtxos: [
                {
                    address: 'two',
                    ...baseUtxo,
                },
            ],
            dustUtxos: [
                {
                    address: 'three',
                    ...baseUtxo,
                },
            ],
            outputLabels: new Map(),
        },
        checkResult: result =>
            result.filteredUtxos.length == 1 &&
            result.filteredSpendableUtxos.length == 1 &&
            result.filteredLowAnonymityUtxos.length == 0 &&
            result.filteredDustUtxos.length == 0,
    },
];

const filterByTxid: FilterAndCategorize[] = [
    {
        params: {
            searchQuery: '1',
            utxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                },
                {
                    address: 'two',
                    ...baseUtxo,
                },
                {
                    address: 'three',
                    ...baseUtxo,
                },
            ],
            spendableUtxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                },
            ],
            lowAnonymityUtxos: [
                {
                    address: 'two',
                    ...baseUtxo,
                },
            ],
            dustUtxos: [
                {
                    address: 'three',
                    ...baseUtxo,
                },
            ],
            outputLabels: new Map(),
        },
        checkResult: result =>
            result.filteredUtxos.length == 3 &&
            result.filteredSpendableUtxos.length == 1 &&
            result.filteredLowAnonymityUtxos.length == 1 &&
            result.filteredDustUtxos.length == 1,
    },
];

const filterByLabel: FilterAndCategorize[] = [
    {
        params: {
            searchQuery: 'label',
            utxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                },
                {
                    address: 'two',
                    ...baseUtxo,
                    txid: '2',
                },
                {
                    address: 'three',
                    ...baseUtxo,
                },
            ],
            spendableUtxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                },
            ],
            lowAnonymityUtxos: [
                {
                    address: 'two',
                    ...baseUtxo,
                    txid: '2',
                },
            ],
            dustUtxos: [
                {
                    address: 'three',
                    ...baseUtxo,
                },
            ],
            outputLabels: new Map([['2', new Map([['1', 'label']])]]),
        },
        checkResult: result =>
            result.filteredUtxos.length == 1 &&
            result.filteredSpendableUtxos.length == 0 &&
            result.filteredLowAnonymityUtxos.length == 1 &&
            result.filteredDustUtxos.length == 0,
    },
];

export const filterAndCategorizeUtxosFixtures = {
    filterByLabel,
    filterByAddress,
    filterByTxid,
};
