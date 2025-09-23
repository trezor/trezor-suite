import { Button, ButtonGroup, Tooltip } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

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
    const openGallery = () => dispatch(openModal({ type: 'device-background-gallery' }));

    const UploadButton = () => (
        <Tooltip
            isActive={isDeviceLocked}
            content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
        >
            <Button
                onClick={onImageUploadClick}
                isDisabled={isDeviceLocked || !isSupportedHomescreen}
                variant="primary"
                data-testid="@settings/device/homescreen-upload"
                key="@settings/device/homescreen-upload"
            >
                <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE" />
            </Button>
        </Tooltip>
    );

    const GalleryButton = () => (
        <Tooltip
            isActive={isDeviceLocked}
            content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
        >
            <Button
                onClick={openGallery}
                isDisabled={isDeviceLocked || !isSupportedHomescreen}
                data-testid="@settings/device/homescreen-gallery"
                key="@settings/device/homescreen-gallery"
                variant="primary"
            >
                <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY" />
            </Button>
        </Tooltip>
    );

    const isHomescreenGallerySupportedOnDevice = deviceModelInternal !== DeviceModelInternal.T3W1;

    if (isHomescreenGallerySupportedOnDevice) {
        return (
            <ButtonGroup size="small">
                <UploadButton />
                <GalleryButton />
            </ButtonGroup>
        );
    }

    return <UploadButton />;
};
