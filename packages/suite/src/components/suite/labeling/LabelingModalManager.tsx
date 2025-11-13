import { selectShowEnableLocalFirstStorageModal } from 'src/actions/suiteSync/suiteSyncSelectors';
import { updateShowEnableLocalFirstStorageModal } from 'src/actions/suiteSync/suiteSyncSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { TurnOnSecureSyncModal } from './TurnOnSecureSyncModal';

export const LabelingModalManager = () => {
    const dispatch = useDispatch();
    const showEnableLocalFirstStorageModal = useSelector(selectShowEnableLocalFirstStorageModal);

    const onClose = () => {
        dispatch(updateShowEnableLocalFirstStorageModal({ show: false }));
    };

    if (!showEnableLocalFirstStorageModal) return null;

    return <TurnOnSecureSyncModal onClose={onClose} />;
};
