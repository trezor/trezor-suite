import { capitalizeFirstLetter } from '@trezor/utils';
import { ActionColumn, SectionItem, TextColumn, ActionButton } from 'src/components/suite/Settings';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { disconnectProvider } from 'src/actions/suite/metadataActions';
import { Translation } from 'src/components/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { selectSelectedProviderForLabels } from 'src/reducers/suite/metadataReducer';

export const DisconnectLabelingProvider = () => {
    const metadata = useSelector(state => state.metadata);
    const selectedProvider = useSelector(selectSelectedProviderForLabels);

    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.LabelingDisconnect);

    const dispatch = useDispatch();

    if (!metadata.enabled || !selectedProvider) return null;

    return (
        <SectionItem
            data-test="@settings/metadata-provider"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
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
                    variant="secondary"
                    onClick={() =>
                        dispatch(disconnectProvider({ clientId: metadata.selectedProvider.labels }))
                    }
                    data-test="@settings/metadata/disconnect-provider-button"
                >
                    <Translation id="TR_DISCONNECT" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
