import { useSelector } from 'react-redux';

import { FirmwareUpgradeNeededModal } from '@suite/firmware-upgrade';
import { useTranslation } from '@suite/intl';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { SuiteSyncTurnOnModal } from './SuiteSyncTurnOnModal';

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
    const { translationString } = useTranslation();
    const suiteSyncInteraction = useSelector(
        (state: WithSuiteSyncAndDeviceState & MessageSystemRootState) =>
            selectSuiteSyncInteraction(state, deviceStaticSessionId),
    );

    if (deviceStaticSessionId === null || suiteSyncInteraction === null) {
        return null;
    }

    switch (suiteSyncInteraction) {
        case 'keys-needed':
            return null;

        case 'unsupported':
            return null;

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
                <FirmwareUpgradeNeededModal
                    onClose={onClose}
                    featureName={translationString('TR_LABELING_SECURE_SYNC')}
                />
            );

        default:
            return exhaustive(suiteSyncInteraction);
    }
};
