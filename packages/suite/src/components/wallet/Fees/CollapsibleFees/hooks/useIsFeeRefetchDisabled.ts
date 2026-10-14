import { useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { type FormState } from '@suite-common/wallet-types';

import { selectIsFeeRefetchBlockedByModal } from '../../feeSelectors';

export function useIsFeeRefetchDisabled() {
    const isBlockedByModal = useSelector(selectIsFeeRefetchBlockedByModal);
    const setMaxOutputId = useWatch<FormState, 'setMaxOutputId'>({ name: 'setMaxOutputId' });

    return setMaxOutputId !== undefined || isBlockedByModal;
}
