import { useMemo } from 'react';

import { type Utxo } from '@trezor/blockchain-link-types';

import { filterUtxos } from './filterAndCategorizeUtxos';
import { type SearchOutputLabels } from './searchLabels';

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
