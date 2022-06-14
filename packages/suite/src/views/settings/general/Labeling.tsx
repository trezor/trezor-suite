import React from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';
import { Switch, Tooltip } from '@trezor/components';

import { Translation } from '@suite-components';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useSelector, useActions, useDevice } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

export const Labeling = () => {
    const { device, isLocked } = useDevice();

    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Labeling);

    const { initMetadata, disableMetadata } = useActions({
        initMetadata: metadataActions.init,
        disableMetadata: metadataActions.disableMetadata,
    });

    const { metadata } = useSelector(state => ({
        metadata: state.metadata,
    }));

    // This should ideally not depend on the device so it should never be disabled.
    // But if user have REMEMBERED device DISCONNECTED, he would get to the wrong state where
    // Labeling is turned on in Settings, but not accessible at all and user is not informed
    // what to do to enable it. That is why it's disabled for now in that case.
    //
    // Following use cases need some bigger UX refactoring:
    // - Labeling enabled without any device connected
    // - Labeling enabled with the device connected inside Settings
    // The initialization of Labeling then start when user select a Wallet.
    const isDisabled = !!device && !metadata.enabled && isLocked();

    return (
        <SectionItem
            data-test="@settings/metadata"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_LABELING_ENABLED" />}
                description={<Translation id="TR_LABELING_FEATURE_ALLOWS" />}
            />
            <ActionColumn>
                <Tooltip
                    maxWidth={280}
                    offset={10}
                    placement="top"
                    content={isDisabled && <Translation id="TR_DISABLED_SWITCH_TOOLTIP" />}
                >
                    <Switch
                        isDisabled={isDisabled}
                        dataTest="@settings/metadata-switch"
                        isChecked={metadata.enabled}
                        onChange={() => {
                            if (metadata.enabled) {
                                disableMetadata();
                            } else {
                                initMetadata(true);
                            }
                            analytics.report({
                                type: EventType.SettingsGeneralLabeling,
                                payload: {
                                    value: !metadata.enabled,
                                },
                            });
                        }}
                    />
                </Tooltip>
            </ActionColumn>
        </SectionItem>
    );
};
