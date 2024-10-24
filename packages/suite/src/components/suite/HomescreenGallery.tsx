import styled from 'styled-components';

import { getNarrowedDeviceModelInternal, resolveStaticPath } from '@suite-common/suite-utils';
import { DeviceModelInternal } from '@trezor/connect';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { getHomescreens } from 'src/constants/suite/homescreens';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { imagePathToHex } from 'src/utils/suite/homescreen';
import { useDevice, useDispatch } from 'src/hooks/suite';

type HomescreensType = ReturnType<typeof getHomescreens>;
type AnyImageName = HomescreensType[keyof HomescreensType][number];

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
`;

const BackgroundGalleryWrapper = styled.div`
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
`;

const BackgroundImageBW64x128 = styled.img`
    border-radius: 3px;
    cursor: pointer;
    width: 64px;
    height: 32px;
`;

const BackgroundImageColor240x240 = styled(BackgroundImageBW64x128)`
    width: 120px;
    height: 120px;
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

    return (
        <Wrapper>
            {[
                DeviceModelInternal.T1B1,
                DeviceModelInternal.T2B1,
                DeviceModelInternal.T3B1,
            ].includes(deviceModelInternal) && (
                <BackgroundGalleryWrapper>
                    {homescreens[deviceModelInternal].map(image => (
                        <BackgroundImageBW64x128
                            data-testid={`@modal/gallery/bw_64x128/${image}`}
                            key={image}
                            id={image}
                            onClick={e =>
                                setHomescreen((e.target as HTMLImageElement).currentSrc, image)
                            }
                            src={resolveStaticPath(`images/homescreens/BW_64x128/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
            {[DeviceModelInternal.T2T1, DeviceModelInternal.T3T1].includes(deviceModelInternal) && (
                <BackgroundGalleryWrapper>
                    {homescreens[deviceModelInternal].map(image => (
                        <BackgroundImageColor240x240
                            data-testid={`@modal/gallery/color_240x240/${image}`}
                            key={image}
                            id={image}
                            onClick={e =>
                                setHomescreen((e.target as HTMLImageElement).currentSrc, image)
                            }
                            src={resolveStaticPath(`images/homescreens/COLOR_240x240/${image}.jpg`)}
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
        </Wrapper>
    );
};
