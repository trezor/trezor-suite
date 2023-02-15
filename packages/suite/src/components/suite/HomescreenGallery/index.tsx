import React from 'react';
import styled from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { resolveStaticPath } from '@trezor/utils';

import { homescreensBW64x128, homescreensColor128x128 } from '@suite-constants';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { elementToHomescreen } from '@suite-utils/homescreen';
import { AcquiredDevice } from '@suite-types';
import { useActions } from '@suite-hooks';
import { DeviceModel, getDeviceModel } from '@trezor/device-utils';

type AnyImageName = (typeof homescreensBW64x128)[number] | (typeof homescreensColor128x128)[number];

const Wrapper = styled.div`
    display: flex;
`;

const BackgroundGalleryWrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
`;

const BackgroundImageColor128x128 = styled.img`
    border-radius: 50%;
    margin: 5px;
    width: 80px;
    height: 80px;
    cursor: pointer;
`;

const BackgroundImageBW64x128 = styled.img`
    margin: 5px;
    border-radius: 3px;
    cursor: pointer;
    width: 64px;
    height: 32px;
`;

type HomescreenGalleryProps = {
    device: AcquiredDevice;
    onConfirm?: () => void;
};

const HomescreenGallery = ({ device, onConfirm }: HomescreenGalleryProps) => {
    const { applySettings } = useActions({ applySettings: deviceSettingsActions.applySettings });

    const deviceModel = getDeviceModel(device);

    if (!deviceModel) return null;

    const setHomescreen = (image: AnyImageName) => {
        const element = document.getElementById(image);
        if (element instanceof HTMLImageElement) {
            const hex = elementToHomescreen(element, deviceModel);
            applySettings({ homescreen: hex });
            if (onConfirm) {
                onConfirm();
            }
        }
    };

    return (
        <Wrapper>
            {[DeviceModel.T1, DeviceModel.TR].includes(deviceModel) && (
                <BackgroundGalleryWrapper>
                    {homescreensBW64x128.map(image => (
                        <BackgroundImageBW64x128
                            data-test={`@modal/gallery/bw_64x128/${image}`}
                            key={image}
                            id={image}
                            // 2 eslint rules clashing
                            onClick={() => {
                                setHomescreen(image);
                                analytics.report({
                                    type: EventType.SettingsDeviceBackground,
                                    payload: {
                                        image,
                                    },
                                });
                            }}
                            src={resolveStaticPath(`images/homescreens/BW_64x128/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
            {deviceModel === DeviceModel.TT && (
                <BackgroundGalleryWrapper>
                    {homescreensColor128x128.map(image => (
                        <BackgroundImageColor128x128
                            data-test={`@modal/gallery/color_128x128/${image}`}
                            key={image}
                            id={image}
                            // 2 eslint rules clashing
                            onClick={() => {
                                setHomescreen(image);
                                analytics.report({
                                    type: EventType.SettingsDeviceBackground,
                                    payload: {
                                        image,
                                    },
                                });
                            }}
                            src={resolveStaticPath(`images/homescreens/COLOR_128x128/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
        </Wrapper>
    );
};

export default HomescreenGallery;
