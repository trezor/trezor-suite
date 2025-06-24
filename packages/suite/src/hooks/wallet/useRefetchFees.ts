import { useEffect } from 'react';
import { useInterval } from 'react-use';

import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FEES_UPDATE_INTERVAL_MILLISECONDS,
    FEE_UPDATE_DELAY_MILLISECONDS,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { UI } from '@trezor/connect';

import { MODAL } from 'src/actions/suite/constants';
import { useDispatch, useSelector } from 'src/hooks/suite';

type UseRefetchFeesProps = { networkSymbol: NetworkSymbol; isDisabled?: boolean };

// Fetch fees only once when component mounts, or when it is enabled at a later time.
export const useFetchFeesOnce = ({ networkSymbol, isDisabled }: UseRefetchFeesProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (isDisabled === true) return;
        dispatch(updateFeeInfoThunk({ networkSymbol }));
    }, [dispatch, networkSymbol, isDisabled]);
};

// Don't refetch when specific critical modals are open
const excludedModalWindowTypes = [
    UI.REQUEST_PASSPHRASE,
    // both are TransactionReviewModal, which should be final and not be subject to sudden change!
    'ButtonRequest_ConfirmOutput',
    'ButtonRequest_SignTx',
];

// Refetch fees periodically, incl. loading behavior
export const useRefetchFees = ({ networkSymbol, isDisabled }: UseRefetchFeesProps) => {
    const dispatch = useDispatch();

    const modal = useSelector(state => state.modal);

    const isExcludedModal =
        modal.context === MODAL.CONTEXT_DEVICE &&
        modal.windowType !== undefined &&
        excludedModalWindowTypes.includes(modal.windowType);

    useInterval(() => {
        if (isDisabled === true) return;
        if (isExcludedModal) return;
        dispatch(
            updateFeeInfoThunk({ networkSymbol, artificialDelay: FEE_UPDATE_DELAY_MILLISECONDS }),
        );
    }, FEES_UPDATE_INTERVAL_MILLISECONDS);
};
