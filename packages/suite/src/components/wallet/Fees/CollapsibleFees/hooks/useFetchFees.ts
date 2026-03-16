import { useWatch } from 'react-hook-form';

import { MODAL_CONTEXT_DEVICE, REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES } from '@suite/modal';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useFetchFeesOnce, useRefetchFees } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

function useIsRefetchDisabled() {
    const modal = useSelector(state => state.modal);
    const setMaxOutputId = useWatch<FormState, 'setMaxOutputId'>({ name: 'setMaxOutputId' });

    if (setMaxOutputId !== undefined) {
        return true;
    }

    if (
        modal.context === MODAL_CONTEXT_DEVICE &&
        modal.windowType !== undefined &&
        REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES.includes(modal.windowType)
    ) {
        return true;
    }

    return false;
}

interface UseFetchFeesProps {
    networkSymbol: NetworkSymbol;
}

export function useFetchFees({ networkSymbol }: UseFetchFeesProps) {
    // It's used under different contexts & form states, but `setMaxOutputId` will be compatible (see `FormState` type)
    const isRefetchDisabled = useIsRefetchDisabled();

    useFetchFeesOnce({ networkSymbol });
    useRefetchFees({ networkSymbol, isDisabled: isRefetchDisabled });
}
