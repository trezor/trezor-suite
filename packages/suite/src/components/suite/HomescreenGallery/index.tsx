import React from 'react';
import styled from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { resolveStaticPath } from '@trezor/utils';

import { homescreensT1, homescreensT2 } from '@suite-constants';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { elementToHomescreen } from '@suite-utils/homescreen';
import { AcquiredDevice } from '@suite-types';
import { useActions } from '@suite-hooks';
import { getDeviceModel } from '@trezor/device-utils';

type AnyImageName = typeof homescreensT1[number] | typeof homescreensT2[number];

const Wrapper = styled.div`
    display: flex;
`;

const BackgroundGalleryWrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
`;

const BackgroundImageT2 = styled.img`
    border-radius: 50%;
    margin: 5px;
    width: 80px;
    height: 80px;
    cursor: pointer;
`;

const BackgroundImageT1 = styled.img`
    margin: 5px;
    border-radius: 3px;
    cursor: pointer;
    width: 64px;
    height: 32px;
`;

type Props = {
    device: AcquiredDevice;
    onConfirm?: () => void;
};

const HomescreenGallery = ({ device, onConfirm }: Props) => {
    const { applySettings } = useActions({ applySettings: deviceSettingsActions.applySettings });

    const isModel1 = getDeviceModel(device) === '1';
    const trezorModel = isModel1 ? 1 : 2;

    const setHomescreen = (image: AnyImageName) => {
        const element = document.getElementById(image);
        if (element instanceof HTMLImageElement) {
            const hex = elementToHomescreen(element, trezorModel);
            applySettings({ homescreen: hex });
            if (onConfirm) {
                onConfirm();
            }
        }
    };

    return (
        <Wrapper>
            {isModel1 && (
                <BackgroundGalleryWrapper>
                    {homescreensT1.map(image => (
                        <BackgroundImageT1
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
                            src={resolveStaticPath(`images/homescreens/t1/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
            {!isModel1 && (
                <BackgroundGalleryWrapper>
                    {homescreensT2.map(image => (
                        <BackgroundImageT2
                            data-test={`@modal/gallery/t2/${image}`}
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
                            src={resolveStaticPath(`images/homescreens/t2/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
        </Wrapper>
    );
};

export default HomescreenGallery;
