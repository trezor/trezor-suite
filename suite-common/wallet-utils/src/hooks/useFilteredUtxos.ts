import { useMemo } from 'react';

import type { Utxo } from '@trezor/blockchain-link-types';

import type { OutputLabels } from '../filterAndCategorizeUtxosUtils';
import { filterUtxos } from '../filterAndCategorizeUtxosUtils';

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
