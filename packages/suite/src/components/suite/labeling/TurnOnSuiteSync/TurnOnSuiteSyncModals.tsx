import { FirmwareUpgradeNeededModal } from '@suite/firmware';
import { useTranslation } from '@suite/intl';
import { selectSuiteSyncInteraction } from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';

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
    const { translationString } = useTranslation();
    const suiteSyncInteraction = useSelector(state =>
        selectSuiteSyncInteraction(state, deviceStaticSessionId),
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
                <FirmwareUpgradeNeededModal
                    onClose={onClose}
                    featureName={translationString('TR_LABELING_SECURE_SYNC')}
                />
            );
        default:
            return exhaustive(suiteSyncInteraction);
    }
};
