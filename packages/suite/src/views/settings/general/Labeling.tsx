import React from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';
import { Switch, Tooltip } from '@trezor/components';
import { HELP_CENTER_LABELING } from '@trezor/urls';
import { Translation } from 'src/components/suite';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useSelector, useActions, useDevice } from 'src/hooks/suite';
import * as metadataActions from 'src/actions/suite/metadataActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

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
                buttonLink={HELP_CENTER_LABELING}
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
