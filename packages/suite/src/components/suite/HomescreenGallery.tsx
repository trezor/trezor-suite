import styled from 'styled-components';

import { resolveStaticPath } from '@suite-common/suite-utils';
import { Grid } from '@trezor/components';
import {
    DeviceModelInternal,
    getNarrowedDeviceModelInternal,
    hasBitcoinOnlyFirmware,
} from '@trezor/device-utils';
import { borders, spacings } from '@trezor/theme';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { getHomescreens } from 'src/constants/suite/homescreens';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { imagePathToHex } from 'src/utils/suite/homescreen';

type HomescreensType = ReturnType<typeof getHomescreens>;
type AnyImageName = HomescreensType[keyof HomescreensType][number];

const PATH_COLOR = 'COLOR_240x240';
const PATH_BW = 'BW_64x128';

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
    const setHomescreen = async (imagePath: string, image: AnyImageName) => {
        if (isLocked()) return;

        // original image is the default image already available in device, set it by empty string
        const isOriginalImage =
            image ===
            `original_${getNarrowedDeviceModelInternal(deviceModelInternal).toLowerCase()}`;

        const hex = isOriginalImage ? '' : await imagePathToHex(imagePath, deviceModelInternal);

        dispatch(applySettings({ homescreen: hex }));

        if (onConfirm) {
            onConfirm();
        }
    };

    const isBitcoinOnlyFirmware =
        deviceModelInternal === DeviceModelInternal.T3T1 && hasBitcoinOnlyFirmware(device);
    const homescreens = getHomescreens(isBitcoinOnlyFirmware); // Get the homescreens based on the firmware type

    const isColorScreen =
        deviceModelInternal === DeviceModelInternal.T2T1 ||
        deviceModelInternal === DeviceModelInternal.T3T1;

    return (
        <Grid gap={spacings.md} columns={4}>
            {homescreens[deviceModelInternal].map(image => {
                const src = resolveStaticPath(
                    `images/homescreens/${isColorScreen ? PATH_COLOR : PATH_BW}/${image}.${isColorScreen ? 'jpg' : 'png'}`,
                );

                return (
                    <HomescreenImage
                        id={image}
                        data-testid={`@modal/gallery/${(isColorScreen ? PATH_COLOR : PATH_BW).toLowerCase()}/${image}`}
                        key={image}
                        onClick={() => setHomescreen(src, image)}
                        src={src}
                    />
                );
            })}
        </Grid>
    );
};
