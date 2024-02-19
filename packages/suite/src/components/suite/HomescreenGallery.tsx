import styled from 'styled-components';
import { resolveStaticPath } from '@suite-common/suite-utils';

import { homescreens } from 'src/constants/suite/homescreens';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { imagePathToHex } from 'src/utils/suite/homescreen';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { DeviceModelInternal } from '@trezor/connect';

type AnyImageName = (typeof homescreens)[keyof typeof homescreens][number];

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
        const isOriginalImage = image === `original_${deviceModelInternal.toLowerCase()}`;

        const hex = isOriginalImage ? '' : await imagePathToHex(imagePath, deviceModelInternal);

        dispatch(applySettings({ homescreen: hex }));

        if (onConfirm) {
            onConfirm();
        }
    };

    return (
        <Wrapper>
            {[DeviceModelInternal.T1B1, DeviceModelInternal.T2B1].includes(deviceModelInternal) && (
                <BackgroundGalleryWrapper>
                    {homescreens[deviceModelInternal].map(image => (
                        <BackgroundImageBW64x128
                            data-test={`@modal/gallery/bw_64x128/${image}`}
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
            {deviceModelInternal === DeviceModelInternal.T2T1 && (
                <BackgroundGalleryWrapper>
                    {homescreens[deviceModelInternal].map(image => (
                        <BackgroundImageColor240x240
                            data-test={`@modal/gallery/color_240x240/${image}`}
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
