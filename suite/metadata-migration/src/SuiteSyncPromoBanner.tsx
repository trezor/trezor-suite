import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectIsLegacyLabelingVisible } from '@suite/metadata';
import { TurnOnSuiteSyncModals } from '@suite/suite-sync';
import { selectDeviceStaticSessionId, selectSelectedDevice } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { type SuiteSync } from '@suite-common/suite-sync-types';
import { SidebarBanner } from '@trezor/product-components';

type SuiteSyncPromoBannerProps = {
    suiteSync: SuiteSync;
};

export const SuiteSyncPromoBanner = ({ suiteSync }: SuiteSyncPromoBannerProps) => {
    const [isTurnOnSuiteSyncModalVisible, setIsTurnOnSuiteSyncModalVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const selectedDevice = useSelector(selectSelectedDevice);
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);
    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);
    const suiteSyncInteraction = useSelector(
        (state: WithSuiteSyncAndDeviceState & MessageSystemRootState) =>
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
                    suiteSync={suiteSync}
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
