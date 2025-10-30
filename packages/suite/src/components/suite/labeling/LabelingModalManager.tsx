import { selectShowEnableLocalFirstStorageModal } from 'src/actions/labeling/labelingSelectors';
import { updateShowEnableLocalFirstStorageModal } from 'src/actions/labeling/labelingSlice';
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
