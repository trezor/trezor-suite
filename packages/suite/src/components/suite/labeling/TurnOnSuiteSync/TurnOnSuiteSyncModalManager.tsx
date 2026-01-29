import { exhaustive } from '@trezor/type-utils';

import {
    selectDesktopSuiteSyncInteraction,
    selectShowEnableSuiteSyncModal,
    updateShowEnableSuiteSyncModal,
} from 'src/actions/suiteSync/suiteSyncSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { SuiteSyncFirmwareUpgradeNeededModal } from './SuiteSyncFirmwareUpgradeNeededModal';
import { SuiteSyncTurnOnAndFwUpgradeModal } from './SuiteSyncTurnOnAndFwUpgradeModal';

export const TurnOnSuiteSyncModalManager = () => {
    const dispatch = useDispatch();
    const deviceStaticSessionId = useSelector(selectShowEnableSuiteSyncModal);

    const suiteSyncInteraction = useSelector(state =>
        selectDesktopSuiteSyncInteraction(state, deviceStaticSessionId),
    );

    if (deviceStaticSessionId === null || suiteSyncInteraction === null) {
        return null;
    }

    const onClose = () => {
        dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId: null }));
    };

    switch (suiteSyncInteraction) {
        case 'unsupported': // This modal is not relevant to unsupported devices.
        case 'keys-needed':
            return null;

        case 'suite-sync-off':
            return (
                <SuiteSyncTurnOnAndFwUpgradeModal
                    onClose={onClose}
                    deviceStaticSessionId={deviceStaticSessionId}
                />
            );

        case 'firmware-upgrade-needed':
            return (
                <SuiteSyncFirmwareUpgradeNeededModal
                    onClose={onClose}
                    deviceStaticSessionId={deviceStaticSessionId}
                />
            );
        default:
            return exhaustive(suiteSyncInteraction);
    }
};
