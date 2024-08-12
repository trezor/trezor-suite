import { getFirmwareDowngradeUrl } from '@suite-common/suite-utils';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const CustomFirmware = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    const isDeviceLocked = isLocked();
    const firmwareDowngradeUrl = getFirmwareDowngradeUrl(device);

    const openModal = () => dispatch(goto('firmware-custom', { params: { cancelable: true } }));

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.CustomFirmware}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_DESCRIPTION" />}
                buttonLink={firmwareDowngradeUrl}
            />
            <ActionColumn>
                <ActionButton
                    onClick={openModal}
                    variant="destructive"
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/custom-firmware-modal-button"
                >
                    <Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
