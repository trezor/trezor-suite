import styled from 'styled-components';

import { useDevice } from '@suite/device';
import { useDispatch } from '@suite-common/redux-utils';
import { Grid } from '@trezor/components';
import {
    DeviceModelInternal,
    getFirmwareVersionArray,
    hasBitcoinOnlyFirmware,
} from '@trezor/device-utils';
import { resolveStaticPath } from '@trezor/env-utils';
import { exhaustive } from '@trezor/type-utils';
import { versionUtils } from '@trezor/utils';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { getDefaultHomeScreenImage, getHomescreens } from 'src/constants/suite/homescreens';
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
    border-radius: 4px;
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

        const isOriginalImage =
            getDefaultHomeScreenImage({ deviceModelInternal, isBitcoinOnlyFirmware }) === image;

        if (isOriginalImage) {
            // Reset homescreen to factory default. Firmware >= 2.9.0 expects
            // homescreen_length: 0; older firmware (e.g. Trezor One 1.x) does
            // not recognize that field and returns "No setting provided", so
            // fall back to an empty homescreen string.
            const fwVersion = getFirmwareVersionArray(device);
            const supportsHomescreenLength =
                fwVersion !== null && versionUtils.isNewerOrEqual(fwVersion, '2.9.0');

            dispatch(
                applySettings(
                    supportsHomescreenLength ? { homescreen_length: 0 } : { homescreen: '' },
                ),
            );
        } else {
            const hex = await imagePathToHex(imagePath, deviceModelInternal);
            dispatch(applySettings({ homescreen: hex }));
        }

        onConfirm?.();
    };

    const homescreens = getHomescreens(isBitcoinOnlyFirmware); // Get the homescreens based on the firmware type
    const path = getHomescreenPath(deviceModelInternal);
    const isColorScreen = path.startsWith('COLOR');

    return (
        <Grid gap={16} columns={4}>
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
