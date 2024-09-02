import { DeviceModelInternal } from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SelectBar } from '@trezor/components';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

type RotationValue = 0 | 90 | 180 | 270;
type Rotation = { label: JSX.Element; value: RotationValue };

const DISPLAY_ROTATIONS: Array<Rotation> = [
    { label: <Translation id="TR_NORTH" />, value: 0 },
    { label: <Translation id="TR_EAST" />, value: 90 },
    { label: <Translation id="TR_SOUTH" />, value: 180 },
    { label: <Translation id="TR_WEST" />, value: 270 },
];

// features.display_rotation cannot be used to determine support because can be defined for devices not supporting rotation (e.g. T2B1).
const DEVICES_SUPPORTING_ROTATION = [DeviceModelInternal.T2T1, DeviceModelInternal.T3T1];

interface DisplayRotationProps {
    isDeviceLocked: boolean;
}

export const DisplayRotation = ({ isDeviceLocked }: DisplayRotationProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const isSupported =
        device?.features !== undefined &&
        DEVICES_SUPPORTING_ROTATION.includes(device.features.internal_model);

    if (!isSupported) {
        return null;
    }

    const currentRotation = device?.features?.display_rotation;

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.DisplayRotation}>
            <TextColumn title={<Translation id="TR_DEVICE_SETTINGS_DISPLAY_ROTATION" />} />
            <ActionColumn>
                <SelectBar
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/rotation-button"
                    selectedOption={currentRotation ?? undefined}
                    options={DISPLAY_ROTATIONS}
                    onChange={(value: number) => {
                        dispatch(applySettings({ display_rotation: value }));
                        analytics.report({
                            type: EventType.SettingsDeviceChangeOrientation,
                            payload: {
                                value: value as RotationValue,
                            },
                        });
                    }}
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
