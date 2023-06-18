import * as recoveryActions from 'src/actions/recovery/recoveryActions';
import { useActions, useSelector } from 'src/hooks/suite';
import { MODAL } from 'src/actions/suite/constants';

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

    let wordRequestInputType;
    if (modal.context === MODAL.CONTEXT_DEVICE) {
        // checks modal reducer if device requested to show word input and which type
        wordRequestInputType = getWordRequestInputType(modal.windowType);
    }

    const actions = useActions({
        setWordsCount: recoveryActions.setWordsCount,
        setAdvancedRecovery: recoveryActions.setAdvancedRecovery,
        recoverDevice: recoveryActions.recoverDevice,
        setStatus: recoveryActions.setStatus,
        resetReducer: recoveryActions.resetReducer,
    });

    return {
        ...recovery,
        ...actions,
        wordRequestInputType,
    };
};
