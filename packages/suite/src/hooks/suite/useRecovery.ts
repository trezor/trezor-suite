import { useMemo } from 'react';

import { WordCount } from '@suite/recovery';

import * as recoveryActions from 'src/actions/recovery/recoveryActions';
import { SeedInputStatus } from 'src/actions/recovery/recoveryActions';
import { MODAL } from 'src/actions/suite/constants';
import { useDispatch, useSelector } from 'src/hooks/suite';

const getWordRequestInputType = (request: string | undefined) => {
    switch (request) {
        case 'WordRequestType_Matrix6':
            return 6;
        case 'WordRequestType_Matrix9':
            return 9;
        case 'WordRequestType_Plain':
            return 'plain';
        default:
            return null;
    }
};

export const useRecovery = () => {
    const recovery = useSelector(state => state.recovery);
    const modal = useSelector(state => state.modal);
    const dispatch = useDispatch();

    let wordRequestInputType;
    if (modal.context === MODAL.CONTEXT_DEVICE) {
        // checks modal reducer if device requested to show word input and which type
        wordRequestInputType = getWordRequestInputType(modal.windowType);
    }

    const actions = useMemo(
        () => ({
            setWordsCount: (count: WordCount) => dispatch(recoveryActions.setWordsCount(count)),
            setAdvancedRecovery: (value: boolean) =>
                dispatch(recoveryActions.setAdvancedRecovery(value)),
            recoverDevice: () => dispatch(recoveryActions.recoverDevice()),
            setStatus: (status: SeedInputStatus) => dispatch(recoveryActions.setStatus(status)),
            resetReducer: () => dispatch(recoveryActions.resetReducer()),
        }),
        [dispatch],
    );

    return {
        ...recovery,
        ...actions,
        wordRequestInputType,
    };
};
