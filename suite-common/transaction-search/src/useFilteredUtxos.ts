import { useMemo } from 'react';

import { Utxo } from '@trezor/blockchain-link-types';

import { filterUtxos } from './filterAndCategorizeUtxos';
import { SearchOutputLabels } from './searchLabels';

export const useFilteredUtxos = (
    utxos: Utxo[] = [],
    query: string = '',
    outputLabels?: SearchOutputLabels,
) =>
    useMemo(() => {
        if (!query.trim()) {
            return utxos;
        }

        return utxos.filter(utxo => filterUtxos(utxo, query, outputLabels));
    }, [utxos, query, outputLabels]);
