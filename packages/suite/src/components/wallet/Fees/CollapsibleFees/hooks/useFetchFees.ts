import { useFormContext } from 'react-hook-form';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { useFetchFeesOnce, useRefetchFees } from '@suite-common/wallet-core';
import { FormState } from '@suite-common/wallet-types';

import { MODAL } from 'src/actions/suite/constants';
import { REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES } from 'src/actions/suite/constants/modalConstants';
import { useSelector } from 'src/hooks/suite';

function useIsRefetchDisabled() {
    const modal = useSelector(state => state.modal);
    const { getValues } = useFormContext<FormState>();
    const setMaxOutputId = getValues('setMaxOutputId');

    if (setMaxOutputId !== undefined) {
        return true;
    }

    if (
        modal.context === MODAL.CONTEXT_DEVICE &&
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
