import React from 'react';

import { capitalizeFirstLetter } from '@trezor/utils';
import { ActionColumn, SectionItem, TextColumn, ActionButton } from '@suite-components/Settings';
import { useSelector, useActions } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { Translation } from '@suite-components';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

export const LabelingDisconnect = () => {
    const { metadata } = useSelector(state => ({
        metadata: state.metadata,
    }));
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.LabelingDisconnect);

    const { disconnectProvider } = useActions({
        disconnectProvider: metadataActions.disconnectProvider,
    });

    if (!metadata.enabled || !metadata.provider) return null;

    return (
        <SectionItem
            data-test="@settings/metadata-provider"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={
                    metadata.provider.isCloud ? (
                        <Translation
                            id="TR_CONNECTED_TO_PROVIDER"
                            values={{
                                provider: capitalizeFirstLetter(metadata.provider.type),
                                user: metadata.provider.user,
                            }}
                        />
                    ) : (
                        <Translation id="TR_CONNECTED_TO_PROVIDER_LOCALLY" />
                    )
                }
                description={
                    metadata.provider.isCloud ? (
                        <Translation id="TR_YOUR_LABELING_IS_SYNCED" />
                    ) : (
                        <Translation id="TR_YOUR_LABELING_IS_SYNCED_LOCALLY" />
                    )
                }
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={() => disconnectProvider()}
                    data-test="@settings/metadata/disconnect-provider-button"
                >
                    <Translation id="TR_DISCONNECT" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
