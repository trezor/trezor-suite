import { useMemo, useState } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { blockchainActions } from '@suite-common/wallet-core';

import { useDispatch, useSelector } from '../suite';

const DEFAULT_GAP_LIMIT = 20;

export const useGapLimitForm = (symbol: NetworkSymbol) => {
    const dispatch = useDispatch();
    const savedGapLimit = useSelector(state => state.wallet.blockchain[symbol]?.backends.gapLimit);

    const [value, setValue] = useState(String(savedGapLimit ?? DEFAULT_GAP_LIMIT));

    const error = useMemo(() => {
        const trimmed = value.trim();
        const num = Number(trimmed);

        if (trimmed === '' || !Number.isInteger(num) || isNaN(num) || num <= 0) {
            return { id: 'TR_GAP_LIMIT_ERROR_POSITIVE' } as const;
        }
        if (num < DEFAULT_GAP_LIMIT) {
            return {
                id: 'TR_GAP_LIMIT_ERROR_TOO_LOW',
                values: { min: DEFAULT_GAP_LIMIT },
            } as const;
        }

        return undefined;
    }, [value]);

    const isSame = value.trim() === String(savedGapLimit ?? DEFAULT_GAP_LIMIT);

    const save = () => {
        dispatch(blockchainActions.setBackendGapLimit({ symbol, gapLimit: Number(value.trim()) }));
    };

    return { value, setValue, error, isSame, save };
};
