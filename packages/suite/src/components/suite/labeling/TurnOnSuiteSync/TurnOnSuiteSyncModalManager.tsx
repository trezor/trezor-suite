import { exhaustive } from '@trezor/type-utils';

import {
    closeEnableSuiteSyncModalAndResolveThunk,
    selectDesktopSuiteSyncInteraction,
    selectShowEnableSuiteSyncModal,
} from 'src/actions/suiteSync/suiteSyncSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { SuiteSyncFirmwareUpgradeNeededModal } from './SuiteSyncFirmwareUpgradeNeededModal';
import { SuiteSyncTurnOnModal } from './SuiteSyncTurnOnModal';
import { SuiteSyncTurnOnUnsupportedModal } from './SuiteSyncTurnOnUnsupportedModal';

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
        dispatch(closeEnableSuiteSyncModalAndResolveThunk(deviceStaticSessionId));
    };

    switch (suiteSyncInteraction) {
        case 'keys-needed':
            return null;

        case 'unsupported':
            return <SuiteSyncTurnOnUnsupportedModal onClose={onClose} />;
        case 'suite-sync-off':
            return (
                <SuiteSyncTurnOnModal
                    onClose={onClose}
                    onSuccess={onClose}
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
