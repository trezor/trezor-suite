import { analytics, EventType } from '@trezor/suite-analytics';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { Button, ButtonGroup } from '@trezor/components';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const DISPLAY_ROTATIONS = [
    { label: <Translation id="TR_NORTH" />, value: 0 },
    { label: <Translation id="TR_EAST" />, value: 90 },
    { label: <Translation id="TR_SOUTH" />, value: 180 },
    { label: <Translation id="TR_WEST" />, value: 270 },
] as const;

interface DisplayRotationProps {
    isDeviceLocked: boolean;
}

export const DisplayRotation = ({ isDeviceLocked }: DisplayRotationProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const currentRotation = device?.features?.display_rotation;

    if (typeof currentRotation !== 'number') {
        return null;
    }

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.DisplayRotation}>
            <TextColumn title={<Translation id="TR_DEVICE_SETTINGS_DISPLAY_ROTATION" />} />
            <ActionColumn>
                <ButtonGroup size="small" isDisabled={isDeviceLocked}>
                    {DISPLAY_ROTATIONS.map(variant => (
                        <Button
                            key={variant.value}
                            variant={currentRotation === variant.value ? 'primary' : 'secondary'}
                            onClick={() => {
                                dispatch(applySettings({ display_rotation: variant.value }));
                                analytics.report({
                                    type: EventType.SettingsDeviceChangeOrientation,
                                    payload: {
                                        value: variant.value,
                                    },
                                });
                            }}
                            data-test={`@settings/device/rotation-button/${variant.value}`}
                        >
                            {variant.label}
                        </Button>
                    ))}
                </ButtonGroup>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
