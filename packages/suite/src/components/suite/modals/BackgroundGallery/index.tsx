import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Translation, Modal } from '@suite-components';

import { homescreensT1, homescreensT2 } from '@suite-constants';
import { resolveStaticPath } from '@suite-utils/nextjs';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { elementToHomescreen } from '@suite-utils/homescreen';
import { AcquiredDevice } from '@suite-types';
import { useActions, useSelector } from '@suite-hooks';

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
    cursor: pointer;
    width: 64px;
    height: 32px;
`;

type Props = {
    device: AcquiredDevice;
    onCancel: () => void;
};

const BackgroundGallery = ({ device, onCancel }: Props) => {
    const egg = useSelector(state => state.suite.settings.egg);
    const { applySettings } = useActions({ applySettings: deviceSettingsActions.applySettings });

    const setHomescreen = (image: string) => {
        const element = document.getElementById(image);
        if (element instanceof HTMLImageElement) {
            const hex = elementToHomescreen(element, device.features.major_version);
            applySettings({ homescreen: hex });
        }
    };

    const t1Screens = useMemo(
        () => (egg ? homescreensT1 : homescreensT1.filter(s => s !== 'carlos')),
        [egg],
    ) as string[];

    const t2Screens = useMemo(
        () => (egg ? homescreensT2 : homescreensT2.filter(s => s !== 'carlos')),
        [egg],
    ) as string[];

    return (
        <Modal
            size="small"
            cancelable
            onCancel={onCancel}
            heading={<Translation id="TR_BACKGROUND_GALLERY" />}
        >
            {device.features.major_version === 1 && (
                <BackgroundGalleryWrapper>
                    {t1Screens.map(image => (
                        <BackgroundImageT1
                            key={image}
                            id={image}
                            onClick={() => setHomescreen(image)}
                            src={resolveStaticPath(`images/png/homescreens/t1/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
            {device.features.major_version === 2 && (
                <BackgroundGalleryWrapper>
                    {t2Screens.map(image => (
                        <BackgroundImageT2
                            data-test={`@modal/gallery/t2/${image}`}
                            key={image}
                            id={image}
                            onClick={() => setHomescreen(image)}
                            src={resolveStaticPath(`images/png/homescreens/t2/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryWrapper>
            )}
        </Modal>
    );
};

export default BackgroundGallery;
