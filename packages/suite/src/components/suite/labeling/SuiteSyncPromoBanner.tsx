import { useState } from 'react';

import { Translation } from '@suite/intl';
import { selectDeviceStaticSessionId, selectSelectedDevice } from '@suite-common/device';
import {
    selectIsSuiteSyncDebugEnabled,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { Button, Column, IconButton, IconCircle, Row, Text } from '@trezor/components';
import { SidebarBanner } from '@trezor/product-components';

import { selectIsLegacyLabelingVisible } from 'src/actions/labels/selectIsLegacyLabelingVisible';
import { useSelector } from 'src/hooks/suite';

import { TurnOnSuiteSyncModals } from './TurnOnSuiteSync/TurnOnSuiteSyncModals';

export const SuiteSyncPromoBanner = () => {
    const [isTurnOnSuiteSyncModalVisible, setIsTurnOnSuiteSyncModalVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const selectedDevice = useSelector(selectSelectedDevice);
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);

    // Todo: remove for the 26.6 release when we want to start advertising for Suite Sync
    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);

    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);
    const suiteSyncInteraction = useSelector(state =>
        selectSuiteSyncInteraction(state, deviceStaticSessionId),
    );
    const shouldDisplayBanner =
        !isDismissed &&
        isSuiteSyncDebugEnabled &&
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

            <SidebarBanner data-testid="@notification/legacy-labeling-upgrade">
                <Column gap={8} alignItems="start">
                    <Column gap={12} alignItems="start">
                        <IconCircle name="arrowsClockwise" size={32} intent="neutral" />

                        <Text typographyStyle="body-md-strong">
                            <Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_HEADING" />
                        </Text>

                        <Text intent="neutral" priority="secondary">
                            <Translation id="TR_LEGACY_LABELING_TURN_ON_SUITE_SYNC_BANNER_DESCRIPTION" />
                        </Text>
                    </Column>

                    <Row gap={8} width="100%" alignItems="stretch">
                        <Button
                            flex="1"
                            onClick={handleTurnOn}
                            data-testid="@notification/legacy-labeling-upgrade/button"
                        >
                            <Translation id="TR_LEARN_MORE" />
                        </Button>

                        <IconButton
                            icon="x"
                            size="medium"
                            intent="neutral"
                            priority="secondary"
                            onClick={handleDismiss}
                            aria-label="Close"
                        />
                    </Row>
                </Column>
            </SidebarBanner>
        </>
    );
};
