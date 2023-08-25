import React from 'react';

import { Translation } from 'src/components/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { getFirmwareDowngradeUrl } from 'src/utils/suite/device';

export const CustomFirmware = () => {
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.CustomFirmware);
    const { device, isLocked } = useDevice();

    const isDeviceLocked = isLocked();
    const firmwareDowngradeUrl = getFirmwareDowngradeUrl(device);

    const openModal = () => dispatch(goto('firmware-custom', { params: { cancelable: true } }));

    return (
        <SectionItem
            data-test="@settings/device/custom-firmware"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
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
                    data-test="@settings/device/custom-firmware-modal-button"
                >
                    <Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
