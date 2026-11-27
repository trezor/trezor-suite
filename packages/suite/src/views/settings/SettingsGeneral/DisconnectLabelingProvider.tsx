import { Translation } from '@suite/intl';
import {
    disconnectProviderThunk,
    selectMetadataEnabled,
    selectSelectedProviderForLabels,
} from '@suite/metadata';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite/useSelector';

export const DisconnectLabelingProvider = () => {
    const isMetadataEnabled = useSelector(selectMetadataEnabled);
    const selectedProvider = useSelector(selectSelectedProviderForLabels);

    const { dispatch } = useServices(injectDispatch);

    if (!isMetadataEnabled || !selectedProvider) return null;

    const handleClick = () =>
        dispatch(
            disconnectProviderThunk({
                clientId: selectedProvider.clientId,
                dataType: 'labels',
            }),
        );

    return (
        <Anchor anchorId={SettingsAnchor.LabelingDisconnect}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
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
                    actions={
                        <SectionItem.Button
                            intent="brand"
                            onClick={handleClick}
                            data-testid="@settings/metadata/disconnect-provider-button"
                        >
                            <Translation id="TR_DISCONNECT" />
                        </SectionItem.Button>
                    }
                />
            )}
        </Anchor>
    );
};
