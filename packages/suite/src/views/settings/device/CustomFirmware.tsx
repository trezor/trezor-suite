import React from 'react';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { WIKI_FW_DOWNGRADE } from '@suite-constants/urls';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';

interface CustomFirmwareProps {
    isDeviceLocked: boolean;
}

export const CustomFirmware = ({ isDeviceLocked }: CustomFirmwareProps) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_DESCRIPTION" />}
                buttonLink={WIKI_FW_DOWNGRADE}
            />
            <ActionColumn>
                <ActionButton
                    onClick={() => {
                        goto('firmware-custom', { cancelable: true });
                    }}
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
