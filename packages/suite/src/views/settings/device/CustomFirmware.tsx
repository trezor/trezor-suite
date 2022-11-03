import React from 'react';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useActions, useDevice } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';
import { getFirmwareDowngradeUrl } from '@suite-utils/device';

export const CustomFirmware = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.CustomFirmware);
    const { device, isLocked } = useDevice();

    const isDeviceLocked = isLocked();
    const firmwareDowngradeUrl = getFirmwareDowngradeUrl(device);

    const openModal = () => goto('firmware-custom', { params: { cancelable: true } });

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
                    variant="danger"
                    isDisabled={isDeviceLocked}
                    data-test="@settings/device/custom-firmware-modal-button"
                >
                    <Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
