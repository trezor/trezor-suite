import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Button, ButtonGroup, Tooltip } from '@trezor/components';
import { type DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { getHomescreens } from '#src/constants/suite/homescreens';
import { useModalLoader } from '#src/hooks/suite/useModalLoader';

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
    const { open, preload, isLoading } = useModalLoader();
    const { device } = useDevice();
    const openGallery = () => open({ type: 'device-background-gallery' });
    const preloadGallery = () => preload('device-background-gallery');

    const isBitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);
    const hasGallery = getHomescreens(isBitcoinOnlyFirmware)[deviceModelInternal].length > 0;

    return (
        <ButtonGroup isDisabled={isDeviceLocked || !isSupportedHomescreen}>
            <Tooltip
                isActive={isDeviceLocked}
                content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
            >
                <Button
                    onClick={onImageUploadClick}
                    data-testid="@settings/device/homescreen-upload"
                    key="@settings/device/homescreen-upload"
                >
                    <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE" />
                </Button>
            </Tooltip>
            {hasGallery ? (
                <Tooltip
                    isActive={isDeviceLocked}
                    content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Button
                        onClick={openGallery}
                        onMouseEnter={preloadGallery}
                        onFocus={preloadGallery}
                        isLoading={isLoading}
                        data-testid="@settings/device/homescreen-gallery"
                        key="@settings/device/homescreen-gallery"
                    >
                        <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY" />
                    </Button>
                </Tooltip>
            ) : null}
        </ButtonGroup>
    );
};
