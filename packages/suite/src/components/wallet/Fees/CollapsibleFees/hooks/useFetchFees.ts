import { useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useFetchFeesOnce, useRefetchFees } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';

import { selectIsFeeRefetchBlockedByModal } from '../../feeSelectors';

function useIsRefetchDisabled() {
    const isBlockedByModal = useSelector(selectIsFeeRefetchBlockedByModal);
    const setMaxOutputId = useWatch<FormState, 'setMaxOutputId'>({ name: 'setMaxOutputId' });

    return setMaxOutputId !== undefined || isBlockedByModal;
}

type UseFetchFeesProps = {
    networkSymbol?: NetworkSymbol;
};

export function useFetchFees({ networkSymbol }: UseFetchFeesProps) {
    // It's used under different contexts & form states, but `setMaxOutputId` will be compatible (see `FormState` type)
    const isRefetchDisabled = useIsRefetchDisabled();

    useFetchFeesOnce({ networkSymbol });
    useRefetchFees({ networkSymbol, isDisabled: isRefetchDisabled });
}
