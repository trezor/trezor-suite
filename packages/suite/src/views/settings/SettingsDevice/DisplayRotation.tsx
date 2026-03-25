import { type JSX } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { Icon, SelectBar, Tooltip } from '@trezor/components';
import { type DisplayRotation as DisplayRotationType, PROTO } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { ActionColumn, TextColumn } from '@trezor/product-components';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

type Rotation = { label: JSX.Element; value: DisplayRotationType };

const DISPLAY_ROTATIONS: Array<Rotation> = [
    {
        label: (
            <Tooltip content={<Translation id="TR_NORTH" />} cursor="pointer" hasArrow>
                <Icon name="arrowUp" />
            </Tooltip>
        ),
        value: 'North',
    },
    {
        label: (
            <Tooltip content={<Translation id="TR_EAST" />} cursor="pointer" hasArrow>
                <Icon name="arrowLeft" />
            </Tooltip>
        ),
        value: 'East',
    },
    {
        label: (
            <Tooltip content={<Translation id="TR_SOUTH" />} cursor="pointer" hasArrow>
                <Icon name="arrowDown" />
            </Tooltip>
        ),
        value: 'South',
    },
    {
        label: (
            <Tooltip content={<Translation id="TR_WEST" />} cursor="pointer" hasArrow>
                <Icon name="arrowRight" />
            </Tooltip>
        ),
        value: 'West',
    },
];

// features.display_rotation cannot be used to determine support because can be defined for devices not supporting rotation (e.g. T3B1).
const DEVICES_SUPPORTING_ROTATION = [DeviceModelInternal.T2T1, DeviceModelInternal.T3T1];

interface DisplayRotationProps {
    isDeviceLocked: boolean;
}

export const DisplayRotation = ({ isDeviceLocked }: DisplayRotationProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const analytics = useAnalytics();
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
                <Tooltip
                    isActive={isDeviceLocked}
                    content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <SelectBar
                        isDisabled={isDeviceLocked}
                        data-testid="@settings/device/rotation-button"
                        selectedOption={currentRotation ?? undefined}
                        options={DISPLAY_ROTATIONS}
                        size="small"
                        onChange={(value: DisplayRotationType) => {
                            dispatch(applySettings({ display_rotation: value }));
                            analytics.report({
                                type: events.settingsDeviceChangeOrientationEvent.name,
                                payload: {
                                    value: PROTO.Enum_DisplayRotation[value],
                                },
                            });
                        }}
                    />
                </Tooltip>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
