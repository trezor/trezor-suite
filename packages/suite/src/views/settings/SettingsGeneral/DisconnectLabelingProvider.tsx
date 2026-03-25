import { Translation } from '@suite/intl';
import { disconnectProvider, selectSelectedProviderForLabels } from '@suite/metadata';
import { SettingsAnchor } from '@suite/router';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';
import { capitalizeFirstLetter } from '@trezor/utils';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const DisconnectLabelingProvider = () => {
    const metadata = useSelector(state => state.metadata);
    const selectedProvider = useSelector(selectSelectedProviderForLabels);

    const dispatch = useDispatch();

    if (!metadata.enabled || !selectedProvider) return null;

    const handleClick = () =>
        dispatch(
            disconnectProvider({
                clientId: metadata.selectedProvider.labels,
                dataType: 'labels',
            }),
        );

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.LabelingDisconnect}>
            <TextColumn
                title={
                    selectedProvider.isCloud ? (
                        <Translation
                            id="TR_CONNECTED_TO_PROVIDER"
                            values={{
                                provider: capitalizeFirstLetter(selectedProvider.type),
                                user: selectedProvider.user,
                            }}
                        />
                    ) : (
                        <Translation id="TR_CONNECTED_TO_PROVIDER_LOCALLY" />
                    )
                }
                description={
                    selectedProvider.isCloud ? (
                        <Translation id="TR_YOUR_LABELING_IS_SYNCED" />
                    ) : (
                        <Translation id="TR_YOUR_LABELING_IS_SYNCED_LOCALLY" />
                    )
                }
            />
            <ActionColumn>
                <ActionButton
                    intent="brand"
                    onClick={handleClick}
                    data-testid="@settings/metadata/disconnect-provider-button"
                >
                    <Translation id="TR_DISCONNECT" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
