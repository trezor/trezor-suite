import { AccountOutputLabels } from '@suite-common/metadata-types';
import { Utxo } from '@trezor/blockchain-link';

export type OutputLabels = { [txid: string]: AccountOutputLabels };

type FilterAndCategorizeUtxosParams = {
    searchQuery: string;
    utxos: Utxo[];
    spendableUtxos: Utxo[];
    lowAnonymityUtxos: Utxo[];
    dustUtxos: Utxo[];
    outputLabels: OutputLabels;
};

export const filterUtxos = (
    utxo: Utxo,
    searchQuery: string,
    outputLabels?: OutputLabels,
): boolean => {
    const lowerCaseSearchQuery = searchQuery.toLowerCase();

    return (
        utxo.address.toLowerCase().includes(lowerCaseSearchQuery) ||
        utxo.txid.toLowerCase().includes(lowerCaseSearchQuery) ||
        (typeof outputLabels?.[utxo.txid]?.[utxo.vout] === 'string'
            ? outputLabels[utxo.txid][utxo.vout].toLowerCase().includes(lowerCaseSearchQuery)
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
}: FilterAndCategorizeUtxosParams) => {
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
