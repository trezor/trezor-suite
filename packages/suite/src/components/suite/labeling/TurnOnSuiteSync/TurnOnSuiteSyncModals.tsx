import { type StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { selectDesktopSuiteSyncInteraction } from 'src/actions/suiteSync/suiteSyncSlice';
import { useSelector } from 'src/hooks/suite';

import { SuiteSyncFirmwareUpgradeNeededModal } from './SuiteSyncFirmwareUpgradeNeededModal';
import { SuiteSyncTurnOnModal } from './SuiteSyncTurnOnModal';
import { SuiteSyncTurnOnUnsupportedModal } from './SuiteSyncTurnOnUnsupportedModal';

type TurnOnSuiteSyncModalsProps = {
    onClose: () => void;
    onSuccess?: () => void;
    deviceStaticSessionId: StaticSessionId | null;
};

export const TurnOnSuiteSyncModals = ({
    onClose,
    onSuccess,
    deviceStaticSessionId,
}: TurnOnSuiteSyncModalsProps) => {
    const suiteSyncInteraction = useSelector(state =>
        selectDesktopSuiteSyncInteraction(state, deviceStaticSessionId),
    );

    if (deviceStaticSessionId === null || suiteSyncInteraction === null) {
        return null;
    }

    switch (suiteSyncInteraction) {
        case 'keys-needed':
            return null;

        case 'unsupported':
            return <SuiteSyncTurnOnUnsupportedModal onClose={onClose} />;
        case 'suite-sync-off':
            return (
                <SuiteSyncTurnOnModal
                    onClose={onClose}
                    onSuccess={onSuccess}
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
