import React from 'react';

import { Switch } from '@trezor/components';
import { Translation } from '@suite-components';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useSelector, useActions, useDevice } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

export const Labeling = () => {
    const { isLocked, device } = useDevice();
    const isDeviceLocked = device && isLocked();

    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Labeling);

    const { initMetadata, disableMetadata } = useActions({
        initMetadata: metadataActions.init,
        disableMetadata: metadataActions.disableMetadata,
    });

    const { metadata } = useSelector(state => ({
        metadata: state.metadata,
    }));

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
                <Switch
                    // hmm maybe it should never be disabled, as it is not device related option (although it triggers device flow?)
                    // but on the other hand there still may be case when it remembered device is disconnected and its metadata.status
                    // is cancelled or disabled. In such case, initMetadata does not make any sense as it needs device connected.
                    // You could say: "ok, whatever, but this switch is changing only application setting, why messing with device?"
                    // Yes, you are right, but if it was done this way, you would enable metadata, then go to wallet, discovery
                    // and maybe device authorization would be triggered and only after that you would get metadata flow started, wouldn't
                    // that be confusing? I believe it is better to do it right away, but need for disabling this switch in specific
                    // edge case is a drawback.
                    isDisabled={!metadata.enabled && !device?.connected && isDeviceLocked}
                    data-test="@settings/metadata-switch"
                    checked={metadata.enabled}
                    onChange={() => (metadata.enabled ? disableMetadata() : initMetadata(true))}
                />
            </ActionColumn>
        </SectionItem>
    );
};
