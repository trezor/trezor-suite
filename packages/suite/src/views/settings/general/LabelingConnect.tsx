import React from 'react';

import { ActionColumn, SectionItem, TextColumn, ActionButton } from '@suite-components/Settings';
import { useSelector, useActions, useDevice } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { Translation } from '@suite-components';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

export const LabelingConnect = () => {
    const { device } = useDevice();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.LabelingConnect);

    const { metadata } = useSelector(state => ({
        metadata: state.metadata,
    }));

    const { initMetadata } = useActions({
        initMetadata: metadataActions.init,
    });

    if (metadata.enabled && !metadata.provider && device?.metadata.status === 'enabled') {
        return (
            <SectionItem
                data-test="@settings/labeling-connect"
                ref={anchorRef}
                shouldHighlight={shouldHighlight}
            >
                <TextColumn
                    title={<Translation id="TR_LABELING_NOT_SYNCED" />}
                    description={<Translation id="TR_TO_MAKE_YOUR_LABELS_PERSISTENT" />}
                />
                <ActionColumn>
                    <ActionButton
                        variant="secondary"
                        onClick={() => initMetadata(true)}
                        data-test="@settings/metadata/connect-provider-button"
                    >
                        <Translation id="TR_CONNECT" />
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        );
    }
    return null;
};
