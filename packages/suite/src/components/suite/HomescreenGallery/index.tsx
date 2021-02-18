import React from 'react';
import styled from 'styled-components';
import { homescreensT1, homescreensT2 } from '@suite-constants';
import { resolveStaticPath } from '@suite-utils/build';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { elementToHomescreen } from '@suite-utils/homescreen';
import { AcquiredDevice } from '@suite-types';
import { useActions, useAnalytics } from '@suite-hooks';

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
    const analytics = useAnalytics();

    const setHomescreen = (image: AnyImageName) => {
        const element = document.getElementById(image);
        if (element instanceof HTMLImageElement) {
            const hex = elementToHomescreen(element, device.features.major_version);
            applySettings({ homescreen: hex });
            if (onConfirm) {
                onConfirm();
            }
        }
    };

    return (
        <Wrapper>
            {device.features.major_version === 1 && (
                <BackgroundGalleryWrapper>
                    {homescreensT1.map(image => (
                        <BackgroundImageT1
                            key={image}
                            id={image}
                            // 2 eslint rules clashing
                            // eslint-disable-next-line require-await
                            onClick={() => {
                                setHomescreen(image);
                                analytics.report({
                                    type: 'settings/device/background',
                                    payload: {
                                        image,
                                    },
                                });
                            }}
                            src={resolveStaticPath(`images/png/homescreens/t1/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
            {device.features.major_version === 2 && (
                <BackgroundGalleryWrapper>
                    {homescreensT2.map(image => (
                        <BackgroundImageT2
                            data-test={`@modal/gallery/t2/${image}`}
                            key={image}
                            id={image}
                            // 2 eslint rules clashing
                            // eslint-disable-next-line require-await
                            onClick={() => {
                                setHomescreen(image);
                                analytics.report({
                                    type: 'settings/device/background',
                                    payload: {
                                        image,
                                    },
                                });
                            }}
                            src={resolveStaticPath(`images/png/homescreens/t2/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
        </Wrapper>
    );
};

export default HomescreenGallery;
