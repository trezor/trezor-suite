import { AccountOutputLabels } from '@suite-common/metadata-types';
import { Utxo } from '@trezor/blockchain-link';

type FilterAndCategorizeUtxosParams = {
    searchQuery: string;
    utxos: Utxo[];
    spendableUtxos: Utxo[];
    lowAnonymityUtxos: Utxo[];
    dustUtxos: Utxo[];
    outputLabels: { [txid: string]: AccountOutputLabels };
};

/**
 * Filter UTXOs based on search query and categorize them into spendable, low anonymity and dust UTXOs.
 */
export const filterAndCategorizeUtxos = (params: FilterAndCategorizeUtxosParams) => {
    const { searchQuery, utxos, spendableUtxos, lowAnonymityUtxos, dustUtxos, outputLabels } =
        params;
    const filterUtxos = (utxo: Utxo) =>
        utxo.address.includes(searchQuery) ||
        utxo.txid.includes(searchQuery) ||
        outputLabels?.[utxo.txid]?.[utxo.vout]?.includes(searchQuery);

    return {
        filteredUtxos: utxos.filter(filterUtxos),
        filteredSpendableUtxos: spendableUtxos.filter(filterUtxos),
        filteredLowAnonymityUtxos: lowAnonymityUtxos.filter(filterUtxos),
        filteredDustUtxos: dustUtxos.filter(filterUtxos),
    };
};
