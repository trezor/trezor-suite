import { NewButton, NewButtonGroup, Tooltip } from '@trezor/components';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite/Translation';
import { useDevice, useDispatch } from 'src/hooks/suite';

import { getHomescreens } from '../../../../constants/suite/homescreens';

type ChangeHomescreenButtonsParams = {
    deviceModelInternal: DeviceModelInternal;
    isDeviceLocked: boolean;
    isSupportedHomescreen: boolean;
    onImageUploadClick: () => void;
};

export const ChangeHomescreenButtons = ({
    deviceModelInternal,
    isDeviceLocked,
    isSupportedHomescreen,
    onImageUploadClick,
}: ChangeHomescreenButtonsParams) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const openGallery = () => dispatch(openModal({ type: 'device-background-gallery' }));

    const isBitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);
    const hasGallery = getHomescreens(isBitcoinOnlyFirmware)[deviceModelInternal].length > 0;

    return (
        <NewButtonGroup isDisabled={isDeviceLocked || !isSupportedHomescreen}>
            <Tooltip
                isActive={isDeviceLocked}
                content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
            >
                <NewButton
                    onClick={onImageUploadClick}
                    data-testid="@settings/device/homescreen-upload"
                    key="@settings/device/homescreen-upload"
                >
                    <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE" />
                </NewButton>
            </Tooltip>
            {hasGallery ? (
                <Tooltip
                    isActive={isDeviceLocked}
                    content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <NewButton
                        onClick={openGallery}
                        data-testid="@settings/device/homescreen-gallery"
                        key="@settings/device/homescreen-gallery"
                    >
                        <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY" />
                    </NewButton>
                </Tooltip>
            ) : null}
        </NewButtonGroup>
    );
};
