import { Translation } from '@suite/intl';
import { metadataLabelingActions } from '@suite/metadata';
import { Anchor, SettingsAnchor } from '@suite/router';
import { Tooltip } from '@trezor/components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDevice, useDispatch } from 'src/hooks/suite';

export const ConnectLabelingProvider = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const isDeviceConnected = device?.connected && device?.available;
    const handleClick = () => dispatch(metadataLabelingActions.init(true));

    return (
        <Anchor anchorId={SettingsAnchor.LabelingConnect}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_LABELING_NOT_SYNCED" />}
                        description={<Translation id="TR_TO_MAKE_YOUR_LABELS_PERSISTENT" />}
                    />
                    <ActionColumn>
                        <Tooltip
                            content={
                                isDeviceConnected ? undefined : (
                                    <Translation id="TR_DEVICE_NOT_CONNECTED" />
                                )
                            }
                        >
                            <ActionButton
                                intent="brand"
                                onClick={handleClick}
                                isDisabled={!isDeviceConnected}
                                data-testid="@settings/metadata/connect-provider-button"
                            >
                                <Translation id="TR_CONNECT" />
                            </ActionButton>
                        </Tooltip>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
