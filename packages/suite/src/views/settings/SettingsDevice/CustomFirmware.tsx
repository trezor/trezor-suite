import { Translation } from '@suite/intl';
import { SettingsAnchor, goto } from '@suite/router';
import { getFirmwareDowngradeUrl } from '@suite-common/suite-utils';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useDevice, useDispatch } from 'src/hooks/suite';

export const CustomFirmware = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    const isDeviceLocked = isLocked();
    const firmwareDowngradeUrl = getFirmwareDowngradeUrl(device);

    const openModal = () =>
        dispatch(goto({ routeName: 'firmware-custom', params: { cancelable: true } }));

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.CustomFirmware}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_DESCRIPTION" />}
                bottomContent={
                    firmwareDowngradeUrl ? (
                        <LearnMoreButton url={firmwareDowngradeUrl} />
                    ) : undefined
                }
            />
            <ActionColumn>
                <ActionButton
                    onClick={openModal}
                    intent="critical"
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/custom-firmware-modal-button"
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
