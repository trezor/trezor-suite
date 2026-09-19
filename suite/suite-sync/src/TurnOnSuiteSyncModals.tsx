import { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';

import { useTranslation } from '@suite/intl';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

const FirmwareUpgradeNeededModal = lazy(() =>
    import(/* webpackChunkName: "modals-firmware" */ '@suite/firmware-upgrade').then(m => ({
        default: m.FirmwareUpgradeNeededModal,
    })),
);
const SuiteSyncTurnOnModal = lazy(() =>
    import(/* webpackChunkName: "modals-connection" */ './SuiteSyncTurnOnModal').then(m => ({
        default: m.SuiteSyncTurnOnModal,
    })),
);

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

        // This component has several render sites, so each lazy modal carries its own boundary.
        case 'suite-sync-off':
            return (
                <Suspense fallback={null}>
                    <SuiteSyncTurnOnModal
                        onClose={onClose}
                        onSuccess={onSuccess}
                        deviceStaticSessionId={deviceStaticSessionId}
                    />
                </Suspense>
            );

        case 'firmware-upgrade-needed':
            return (
                <Suspense fallback={null}>
                    <FirmwareUpgradeNeededModal
                        onClose={onClose}
                        featureName={translationString('TR_LABELING_SECURE_SYNC')}
                    />
                </Suspense>
            );

        default:
            return exhaustive(suiteSyncInteraction);
    }
};
