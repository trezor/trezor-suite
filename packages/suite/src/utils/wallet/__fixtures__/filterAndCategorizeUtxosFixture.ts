import { Utxo } from '@trezor/blockchain-link';

const baseUtxo: Omit<Utxo, 'address'> = {
    txid: '1',
    vout: 1,
    amount: '100',
    blockHeight: 100,
    path: 'string',
    confirmations: 100,
};

type FilterUtxosParams = {
    searchQuery: string;
    utxos: Utxo[];
    spendableUtxos: Utxo[];
    lowAnonymityUtxos: Utxo[];
    dustUtxos: Utxo[];
    outputLabels: { [txid: string]: any };
};

type FilterUtxosResult = {
    filteredUtxos: Utxo[];
    filteredSpendableUtxos: Utxo[];
    filteredLowAnonymityUtxos: Utxo[];
    filteredDustUtxos: Utxo[];
};

type FilterAndCategorize = {
    params: FilterUtxosParams;
    checkResult: (result: FilterUtxosResult) => boolean;
};

export const filterByAddress: FilterAndCategorize[] = [
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
            outputLabels: {},
        },
        checkResult: result => {
            return (
                result.filteredUtxos.length == 1 &&
                result.filteredSpendableUtxos.length == 1 &&
                result.filteredLowAnonymityUtxos.length == 0 &&
                result.filteredDustUtxos.length == 0
            );
        },
    },
];

export const filterByTxid: FilterAndCategorize[] = [
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
            outputLabels: {},
        },
        checkResult: result => {
            return (
                result.filteredUtxos.length == 3 &&
                result.filteredSpendableUtxos.length == 1 &&
                result.filteredLowAnonymityUtxos.length == 1 &&
                result.filteredDustUtxos.length == 1
            );
        },
    },
];

export const filterByLabel: FilterAndCategorize[] = [
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
            outputLabels: {
                '2': {
                    1: 'label',
                },
            },
        },
        checkResult: result => {
            return (
                result.filteredUtxos.length == 1 &&
                result.filteredSpendableUtxos.length == 0 &&
                result.filteredLowAnonymityUtxos.length == 1 &&
                result.filteredDustUtxos.length == 0
            );
        },
    },
];
