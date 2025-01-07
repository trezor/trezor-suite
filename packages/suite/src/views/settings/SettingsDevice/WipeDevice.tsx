import { isDeviceInBootloaderMode } from '@trezor/device-utils';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface WipeDeviceProps {
    isDeviceLocked: boolean;
}

export const WipeDevice = ({ isDeviceLocked }: WipeDeviceProps) => {
    const { device } = useDevice();
    const dispatch = useDispatch();

    const isBootloaderMode = isDeviceInBootloaderMode(device);

    const handleClick = () => dispatch(openModal({ type: 'wipe-device' }));

    const headingTranslation = isBootloaderMode
        ? 'TR_DEVICE_SETTINGS_FACTORY_RESET'
        : 'TR_DEVICE_SETTINGS_WIPE_DEVICE';

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.WipeDevice}>
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
                    onClick={handleClick}
                    variant="destructive"
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/open-wipe-modal-button"
                >
                    <Translation id={headingTranslation} />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
