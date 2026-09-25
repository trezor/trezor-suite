import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { metadataLabelingActions } from '@suite/metadata';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { SectionItem } from '@trezor/product-components';

export const ConnectLabelingProvider = () => {
    const { dispatch } = useServices(injectDispatch);
    const { device } = useDevice();
    const isDeviceConnected = device?.connected && device?.available;
    const handleClick = () => dispatch(metadataLabelingActions.initThunk(true));

    return (
        <Anchor anchorId={SettingsAnchor.LabelingConnect}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_LABELING_NOT_SYNCED" />}
                    description={<Translation id="TR_TO_MAKE_YOUR_LABELS_PERSISTENT" />}
                    actions={
                        <SectionItem.Button
                            intent="brand"
                            onClick={handleClick}
                            isDisabled={!isDeviceConnected}
                            data-testid="@settings/metadata/connect-provider-button"
                            tooltipContent={
                                isDeviceConnected ? undefined : (
                                    <Translation id="TR_DEVICE_NOT_CONNECTED" />
                                )
                            }
                        >
                            <Translation id="TR_CONNECT" />
                        </SectionItem.Button>
                    }
                />
            )}
        </Anchor>
    );
};
