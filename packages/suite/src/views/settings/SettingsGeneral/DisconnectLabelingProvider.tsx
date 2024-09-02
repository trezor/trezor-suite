import { capitalizeFirstLetter } from '@trezor/utils';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { disconnectProvider } from 'src/actions/suite/metadataProviderActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { selectSelectedProviderForLabels } from 'src/reducers/suite/metadataReducer';

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
                    variant="primary"
                    onClick={handleClick}
                    data-testid="@settings/metadata/disconnect-provider-button"
                >
                    <Translation id="TR_DISCONNECT" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
