import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal } from '@trezor/components';
import { Translation } from '@suite-components';

import { homescreensT1, homescreensT2 } from '@suite-constants';
import { resolveStaticPath } from '@suite-utils/nextjs';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { elementToHomescreen } from '@suite-utils/homescreen';
import { Dispatch, AcquiredDevice } from '@suite-types';

type AnyImageName = typeof homescreensT1[number] | typeof homescreensT2[number];

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

const mapDispatchToProps = (dispatch: Dispatch) => ({
    applySettings: bindActionCreators(deviceSettingsActions.applySettings, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & {
    device: AcquiredDevice;
    onCancel: () => void;
};

const BackgroundGallery = ({ device, applySettings, onCancel }: Props) => {
    const setHomescreen = (image: AnyImageName) => {
        const element = document.getElementById(image);
        if (element instanceof HTMLImageElement) {
            const hex = elementToHomescreen(element, device.features.major_version);
            applySettings({ homescreen: hex });
        }
    };

    return (
        <Modal
            size="small"
            cancelable
            onCancel={onCancel}
            heading={<Translation id="TR_BACKGROUND_GALLERY" />}
        >
            {device.features.major_version === 1 && (
                <BackgroundGalleryWrapper>
                    {homescreensT1.map(image => (
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
                    {homescreensT2.map(image => (
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

export default connect(null, mapDispatchToProps)(BackgroundGallery);
