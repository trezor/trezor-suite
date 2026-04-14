import { useState } from 'react';

import { Translation } from '@suite/intl';
import { selectDeviceStaticSessionId } from '@suite-common/device';
import {
    selectIsSuiteSyncDebugEnabled,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { Button, Column, Icon, Row, Text, TextButton } from '@trezor/components';
import { SidebarBanner } from '@trezor/product-components';
import { HELP_CENTER_LABELING } from '@trezor/urls';

import { selectIsLegacyLabelingVisible } from 'src/actions/labels/selectIsLegacyLabelingVisible';
import { useSelector } from 'src/hooks/suite';

import { TurnOnSuiteSyncModals } from './TurnOnSuiteSync/TurnOnSuiteSyncModals';

export const SuiteSyncPromoBanner = () => {
    const [isTurnOnSuiteSyncModalVisible, setIsTurnOnSuiteSyncModalVisible] = useState(false);

    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);

    // Todo: remove for the 26.6 release when we want to start advertising for Suite Sync
    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);

    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);
    const suiteSyncInteraction = useSelector(state =>
        selectSuiteSyncInteraction(state, deviceStaticSessionId),
    );
    const shouldDisplayBanner =
        isSuiteSyncDebugEnabled &&
        isLegacyLabelingVisible &&
        suiteSyncInteraction !== 'unsupported';

    if (!shouldDisplayBanner) {
        return null;
    }

    const handleTurnOn = () => setIsTurnOnSuiteSyncModalVisible(true);

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
                <Column gap={12} alignItems="start">
                    <Row>
                        <Icon name="arrowsCounterClockwise" size={16} />
                    </Row>

                    <Column gap={4} alignItems="start">
                        <Text typographyStyle="headline-sm">
                            <Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_HEADING" />
                        </Text>

                        <Text intent="neutral" priority="secondary">
                            <Translation id="TR_LEGACY_LABELING_TURN_ON_SUITE_SYNC_BANNER_DESCRIPTION" />
                        </Text>
                    </Column>

                    <TextButton href={HELP_CENTER_LABELING} size="small" isUnderlined>
                        <Translation id="TR_LEARN_MORE" />
                    </TextButton>

                    <Button
                        onClick={handleTurnOn}
                        data-testid="@notification/legacy-labeling-upgrade/button"
                    >
                        <Translation id="TR_TURN_ON_SECURE_SYNC" />
                    </Button>
                </Column>
            </SidebarBanner>
        </>
    );
};
