import React from 'react';
import styled from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { resolveStaticPath } from '@trezor/utils';

import { homescreensBW64x128, homescreensColor240x240 } from '@suite-constants/homescreens';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { elementToHomescreen } from '@suite-utils/homescreen';
import { AcquiredDevice } from '@suite-types';
import { useActions } from '@suite-hooks';
import { DeviceModel, getDeviceModel } from '@trezor/device-utils';

type AnyImageName = (typeof homescreensBW64x128)[number] | (typeof homescreensColor240x240)[number];

const Wrapper = styled.div`
    display: flex;
`;

const BackgroundGalleryWrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
`;

const BackgroundImageColor240x240 = styled.img`
    border-radius: 3px;
    margin: 5px;
    width: 120px;
    height: 120px;
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

export const HomescreenGallery = ({ device, onConfirm }: HomescreenGalleryProps) => {
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
                    {homescreensColor240x240.map(image => (
                        <BackgroundImageColor240x240
                            data-test={`@modal/gallery/color_240x240/${image}`}
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
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
        </Wrapper>
    );
};
