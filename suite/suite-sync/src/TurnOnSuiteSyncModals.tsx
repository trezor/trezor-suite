import { useSelector } from 'react-redux';

import { useTranslation } from '@suite/intl';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { ModalLoader } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';
import { lazyComponentByName } from '@trezor/lazy-loading';
import { exhaustive } from '@trezor/type-utils';

const { LazyComponent: FirmwareUpgradeNeededModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-firmware" */ '@suite/firmware-upgrade'),
    'FirmwareUpgradeNeededModal',
);
const { LazyComponent: SuiteSyncTurnOnModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connection" */ './SuiteSyncTurnOnModal'),
    'SuiteSyncTurnOnModal',
);

type TurnOnSuiteSyncModalsProps = {
    onClose: () => void;
    /** Reports a modal that failed to load. This package cannot reach Suite's Sentry thunk. */
    onError?: (error: Error) => void;
    onSuccess?: () => void;
    deviceStaticSessionId: StaticSessionId | null;
};

export const TurnOnSuiteSyncModals = ({
    onClose,
    onError,
    onSuccess,
    deviceStaticSessionId,
}: TurnOnSuiteSyncModalsProps) => {
    const { translationString } = useTranslation();

    /** Closing leaves the device usable; the modal itself cannot be retried after a failed load. */
    const handleError = (error: Error) => {
        onError?.(error);
        onClose();
    };
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

        // This component has several render sites, so each lazy modal carries its own boundary.
        case 'suite-sync-off':
            return (
                <ModalLoader name={suiteSyncInteraction} onError={handleError}>
                    <SuiteSyncTurnOnModal
                        onClose={onClose}
                        onSuccess={onSuccess}
                        deviceStaticSessionId={deviceStaticSessionId}
                    />
                </ModalLoader>
            );

        case 'firmware-upgrade-needed':
            return (
                <ModalLoader name={suiteSyncInteraction} onError={handleError}>
                    <FirmwareUpgradeNeededModal
                        onClose={onClose}
                        featureName={translationString('TR_LABELING_SECURE_SYNC')}
                    />
                </ModalLoader>
            );

        default:
            return exhaustive(suiteSyncInteraction);
    }
};
