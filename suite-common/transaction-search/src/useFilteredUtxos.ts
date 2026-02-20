import { useMemo } from 'react';

import { Utxo } from '@trezor/blockchain-link-types';

import { OutputLabels, filterUtxos } from './filterAndCategorizeUtxos';

export const useFilteredUtxos = (
    utxos: Utxo[] = [],
    query: string = '',
    outputLabels?: OutputLabels,
) =>
    useMemo(() => {
        if (!query.trim()) {
            return utxos;
        }

        return utxos.filter(utxo => filterUtxos(utxo, query, outputLabels));
    }, [utxos, query, outputLabels]);
