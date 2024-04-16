import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { ChangeDeviceLabel } from 'src/components/suite/ChangeDeviceLabel';

interface DeviceLabelProps {
    isDeviceLocked: boolean;
}

export const DeviceLabel = ({ isDeviceLocked }: DeviceLabelProps) => {
    return (
        <SettingsSectionItem anchorId={SettingsAnchor.DeviceLabel}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_DEVICE_LABEL" />}
                description={
                    <Translation id="TR_LABEL_REQUIREMENTS" values={{ length: MAX_LABEL_LENGTH }} />
                }
            />
            <ActionColumn>
                <ChangeDeviceLabel isVertical isDeviceLocked={isDeviceLocked} />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
