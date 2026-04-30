import { useState } from 'react';

import { Translation } from '@suite/intl';
import { selectIsLegacyLabelingVisible } from '@suite/metadata';
import { selectDeviceStaticSessionId, selectSelectedDevice } from '@suite-common/device';
import { selectSuiteSyncInteraction } from '@suite-common/suite-sync';
import { SidebarBanner } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

import { TurnOnSuiteSyncModals } from './TurnOnSuiteSync/TurnOnSuiteSyncModals';

export const SuiteSyncPromoBanner = () => {
    const [isTurnOnSuiteSyncModalVisible, setIsTurnOnSuiteSyncModalVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const selectedDevice = useSelector(selectSelectedDevice);
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);

    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);
    const suiteSyncInteraction = useSelector(state =>
        selectSuiteSyncInteraction(state, deviceStaticSessionId),
    );
    const shouldDisplayBanner =
        !isDismissed &&
        isLegacyLabelingVisible &&
        selectedDevice !== undefined &&
        selectedDevice.connected &&
        suiteSyncInteraction !== 'unsupported';

    if (!shouldDisplayBanner) {
        return null;
    }

    const handleTurnOn = () => setIsTurnOnSuiteSyncModalVisible(true);
    const handleDismiss = () => setIsDismissed(true);

    return (
        <>
            {isTurnOnSuiteSyncModalVisible && (
                <TurnOnSuiteSyncModals
                    deviceStaticSessionId={deviceStaticSessionId}
                    onClose={() => setIsTurnOnSuiteSyncModalVisible(false)}
                    onSuccess={() => setIsTurnOnSuiteSyncModalVisible(false)}
                />
            )}

            <SidebarBanner
                ctaDataTestId="@notification/legacy-labeling-upgrade/button"
                ctaLabel={<Translation id="TR_LEARN_MORE" />}
                closeLabel={<Translation id="TR_DISMISS" />}
                data-testid="@notification/legacy-labeling-upgrade"
                description={
                    <Translation id="TR_LEGACY_LABELING_TURN_ON_SUITE_SYNC_BANNER_DESCRIPTION" />
                }
                heading={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_HEADING" />}
                icon="arrowsClockwise"
                onClick={handleTurnOn}
                onClose={handleDismiss}
            />
        </>
    );
};
