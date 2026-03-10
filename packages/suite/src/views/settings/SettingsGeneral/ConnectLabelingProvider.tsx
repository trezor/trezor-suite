import { Translation } from '@suite/intl';
import { metadataLabelingActions } from '@suite/metadata';
import { SettingsAnchor } from '@suite/router';
import { Tooltip } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionButton, ActionColumn, TextColumn } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';

export const ConnectLabelingProvider = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const isDeviceConnected = device?.connected && device?.available;
    const handleClick = () => dispatch(metadataLabelingActions.init(true));

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.LabelingConnect}>
            <TextColumn
                title={<Translation id="TR_LABELING_NOT_SYNCED" />}
                description={<Translation id="TR_TO_MAKE_YOUR_LABELS_PERSISTENT" />}
            />
            <ActionColumn>
                <Tooltip
                    content={
                        isDeviceConnected ? undefined : <Translation id="TR_DEVICE_NOT_CONNECTED" />
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
        </SettingsSectionItem>
    );
};
