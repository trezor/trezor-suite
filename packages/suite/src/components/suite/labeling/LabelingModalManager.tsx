import { setFlag } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import { TurnOnSecureSyncModal } from './TurnOnSecureSyncModal';

export const LabelingModalManager = () => {
    const dispatch = useDispatch();
    const { showEnableLocalFirstStorageModal } = useSelector(selectSuiteFlags);

    const onClose = () => {
        dispatch(setFlag('showEnableLocalFirstStorageModal', false));
    };

    if (!showEnableLocalFirstStorageModal) return null;

    return <TurnOnSecureSyncModal onClose={onClose} />;
};
