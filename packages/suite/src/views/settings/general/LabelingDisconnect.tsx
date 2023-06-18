import React from 'react';

import { capitalizeFirstLetter } from '@trezor/utils';
import { ActionColumn, SectionItem, TextColumn, ActionButton } from 'src/components/suite/Settings';
import { useSelector, useActions } from 'src/hooks/suite';
import * as metadataActions from 'src/actions/suite/metadataActions';
import { Translation } from 'src/components/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

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
