import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import {
    type LegacyLabelingVisibleRootState,
    selectIsLegacyLabelingVisible,
} from '@suite/metadata';
import { TurnOnSuiteSyncModals } from '@suite/suite-sync';
import {
    type DeviceRootState,
    selectDeviceStaticSessionId,
    selectSelectedDevice,
} from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { SidebarBanner } from '@trezor/product-components';

type SuiteSyncPromoBannerRootState = LegacyLabelingVisibleRootState &
    WithSuiteSyncAndDeviceState &
    MessageSystemRootState &
    DeviceRootState;

export const selectShouldShowSuiteSyncPromoBanner = (state: SuiteSyncPromoBannerRootState) => {
    const selectedDevice = selectSelectedDevice(state);
    const deviceStaticSessionId = selectDeviceStaticSessionId(state);

    return (
        selectIsLegacyLabelingVisible(state) &&
        selectedDevice !== undefined &&
        selectedDevice.connected &&
        selectSuiteSyncInteraction(state, deviceStaticSessionId) !== 'unsupported'
    );
};

type SuiteSyncPromoBannerProps = {
    onDismiss: () => void;
};

export const SuiteSyncPromoBanner = ({ onDismiss }: SuiteSyncPromoBannerProps) => {
    const [isTurnOnSuiteSyncModalVisible, setIsTurnOnSuiteSyncModalVisible] = useState(false);

    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);

    const handleTurnOn = () => setIsTurnOnSuiteSyncModalVisible(true);
    const handleDismiss = () => onDismiss();

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
