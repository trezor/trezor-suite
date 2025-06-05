import { useState } from 'react';

import { isDeviceInBootloaderMode } from '@trezor/device-utils';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice } from 'src/hooks/suite';

import { WipeDeviceModal } from './WipeDeviceModal';

interface WipeDeviceProps {
    isDeviceLocked: boolean;
}

export const WipeDevice = ({ isDeviceLocked }: WipeDeviceProps) => {
    const { device } = useDevice();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isBootloaderMode = isDeviceInBootloaderMode(device);

    const headingTranslation = isBootloaderMode
        ? 'TR_DEVICE_SETTINGS_FACTORY_RESET'
        : 'TR_DEVICE_SETTINGS_WIPE_DEVICE';

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.WipeDevice}>
            {isModalOpen && <WipeDeviceModal onCancel={() => setIsModalOpen(false)} />}
            <TextColumn
                title={<Translation id={headingTranslation} />}
                description={
                    <Translation
                        id={
                            isBootloaderMode
                                ? 'TR_FACTORY_RESET_DESCRIPTION'
                                : 'TR_WIPE_DEVICE_DESCRIPTION'
                        }
                    />
                }
            />
            <ActionColumn>
                <ActionButton
                    onClick={() => setIsModalOpen(true)}
                    variant="destructive"
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/open-wipe-modal-button"
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id={headingTranslation} />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
