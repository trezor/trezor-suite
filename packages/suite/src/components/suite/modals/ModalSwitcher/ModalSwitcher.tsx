import { ThpGlobalModalManager } from '@suite/firmware';

import {
    selectShowEnableSuiteSyncModal,
    updateShowEnableSuiteSyncModal,
} from 'src/actions/suiteSync/suiteSyncSlice';
import { ConnectionGlobalModalManager } from 'src/components/connection/ConnectionGlobalModalManager';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { usePreferredModal } from 'src/hooks/suite/usePreferredModal';

import { ForegroundAppModal } from './ForegroundAppModal';
import { WipedBleDeviceNeedsManualOsRemovalModalManager } from '../../bluetooth/WipedBleDeviceNeedsManualOsRemovalModalManager';
import { TurnOnSuiteSyncModals } from '../../labeling/TurnOnSuiteSync/TurnOnSuiteSyncModals';
import { ReduxModal } from '../ReduxModal/ReduxModal';

type ModalParams = ReturnType<typeof usePreferredModal>;

const Inner = ({ modal }: { modal: ModalParams }) => {
    switch (modal.type) {
        case 'redux-modal':
            return <ReduxModal {...modal.payload} />;
        default:
            return null;
    }
};

/** Displays whichever redux modal or foreground app should be displayed */
export const ModalSwitcher = () => {
    const modal = usePreferredModal();
    const dispatch = useDispatch();
    const deviceStaticSessionId = useSelector(selectShowEnableSuiteSyncModal);

    // For foreground apps, we have to NOT render the other modals.
    // There may be conflicts: for example, Firmware Install / Upgrade flow
    // handles the THP separately.
    if (modal.type === 'foreground-app') {
        return <ForegroundAppModal {...modal.payload} />;
    }

    return (
        <>
            <WipedBleDeviceNeedsManualOsRemovalModalManager />
            <ThpGlobalModalManager />
            <TurnOnSuiteSyncModals
                deviceStaticSessionId={deviceStaticSessionId}
                onClose={() => {
                    dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId: null }));
                }}
            />
            <ConnectionGlobalModalManager />
            <Inner modal={modal} />
        </>
    );
};
