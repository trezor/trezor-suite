import { Utxo } from '@trezor/blockchain-link';

import { SearchOutputLabels } from './searchLabels';

export type FilterAndCategorizeUtxosParams = {
    searchQuery: string;
    utxos: Utxo[];
    spendableUtxos: Utxo[];
    lowAnonymityUtxos: Utxo[];
    dustUtxos: Utxo[];
    outputLabels: SearchOutputLabels;
};

export type FilterAndCategorizeUtxosResult = {
    filteredUtxos: Utxo[];
    filteredSpendableUtxos: Utxo[];
    filteredLowAnonymityUtxos: Utxo[];
    filteredDustUtxos: Utxo[];
};

export const filterUtxos = (
    utxo: Utxo,
    searchQuery: string,
    outputLabels?: SearchOutputLabels,
): boolean => {
    const lowerCaseSearchQuery = searchQuery.toLowerCase();
    const accountOutputLabels = outputLabels?.get(utxo.txid);

    // Todo: This `utxo.vout` is bad nad will not work for SuiteSync & Tokens
    //       The `TxTargetId` type shall be constructed and used instead of `vout` number
    const outputLabel = accountOutputLabels?.get(String(utxo.vout));

    return (
        utxo.address.toLowerCase().includes(lowerCaseSearchQuery) ||
        utxo.txid.toLowerCase().includes(lowerCaseSearchQuery) ||
        (typeof outputLabel === 'string'
            ? outputLabel.toLowerCase().includes(lowerCaseSearchQuery)
            : false)
    );
};

/**
 * Filter UTXOs based on search query and categorize them into spendable, low anonymity and dust UTXOs.
 */
export const filterAndCategorizeUtxos = ({
    searchQuery,
    utxos,
    spendableUtxos,
    lowAnonymityUtxos,
    dustUtxos,
    outputLabels,
}: FilterAndCategorizeUtxosParams): FilterAndCategorizeUtxosResult => {
    const lowerCaseSearchQuery = searchQuery.toLowerCase();

    return {
        filteredUtxos: utxos.filter(utxo => filterUtxos(utxo, lowerCaseSearchQuery, outputLabels)),
        filteredSpendableUtxos: spendableUtxos.filter(utxo =>
            filterUtxos(utxo, lowerCaseSearchQuery, outputLabels),
        ),
        filteredLowAnonymityUtxos: lowAnonymityUtxos.filter(utxo =>
            filterUtxos(utxo, lowerCaseSearchQuery, outputLabels),
        ),
        filteredDustUtxos: dustUtxos.filter(utxo =>
            filterUtxos(utxo, lowerCaseSearchQuery, outputLabels),
        ),
    };
};
