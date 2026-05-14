import styled from 'styled-components';

import { useDevice } from '@suite/device';
import { Grid } from '@trezor/components';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { resolveStaticPath } from '@trezor/env-utils';
import { borders, spacings } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { getDefaultHomeScreenImage, getHomescreens } from 'src/constants/suite/homescreens';
import { useDispatch } from 'src/hooks/suite';
import { imagePathToHex } from 'src/utils/suite/homescreen';

type HomescreensType = ReturnType<typeof getHomescreens>;
type AnyImageName = HomescreensType[keyof HomescreensType][number];

const getHomescreenPath = (deviceModelInternal: DeviceModelInternal) => {
    switch (deviceModelInternal) {
        case DeviceModelInternal.T1B1:
        case DeviceModelInternal.T2B1:
        case DeviceModelInternal.T3B1:
            return 'BW_64x128';
        case DeviceModelInternal.T2T1:
        case DeviceModelInternal.T3T1:
        case DeviceModelInternal.UNKNOWN:
            return 'COLOR_240x240';
        case DeviceModelInternal.T3W1:
            return 'COLOR_520x380';
        default:
            return exhaustive(deviceModelInternal);
    }
};

const HomescreenImage = styled.img`
    display: block;
    width: 100%;
    cursor: pointer;
    border-radius: ${borders.radii.xs};
`;

type HomescreenGalleryProps = {
    onConfirm?: () => void;
};

export const HomescreenGallery = ({ onConfirm }: HomescreenGalleryProps) => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    const deviceModelInternal = device?.features?.internal_model;

    if (!deviceModelInternal) return null;

    const isBitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);
    const setHomescreen = async (imagePath: string, image: AnyImageName) => {
        if (isLocked()) return;

        // original image is the default image already available in device, set it by empty string
        const isOriginalImage =
            getDefaultHomeScreenImage({ deviceModelInternal, isBitcoinOnlyFirmware }) === image;

        if (isOriginalImage) {
            dispatch(applySettings({ homescreen_length: 0 }));
        } else {
            const hex = isOriginalImage ? '' : await imagePathToHex(imagePath, deviceModelInternal);
            dispatch(applySettings({ homescreen: hex }));
        }

        onConfirm?.();
    };

    const homescreens = getHomescreens(isBitcoinOnlyFirmware); // Get the homescreens based on the firmware type
    const path = getHomescreenPath(deviceModelInternal);
    const isColorScreen = path.startsWith('COLOR');

    return (
        <Grid gap={spacings.md} columns={4}>
            {homescreens[deviceModelInternal].map(image => {
                const src = resolveStaticPath(
                    `images/homescreens/${path}/${image}.${isColorScreen ? 'jpg' : 'png'}`,
                );

                return (
                    <HomescreenImage
                        id={image}
                        data-testid={`@modal/gallery/${path.toLowerCase()}/${image}`}
                        key={image}
                        onClick={() => setHomescreen(src, image)}
                        src={src}
                    />
                );
            })}
        </Grid>
    );
};
