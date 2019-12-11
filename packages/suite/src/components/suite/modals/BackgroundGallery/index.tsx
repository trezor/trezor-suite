import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { H2 } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { homescreensT1, homescreensT2 } from '@suite-constants';
import { resolveStaticPath } from '@suite-utils/nextjs';
import * as deviceSettingsActions from '@suite-actions/deviceSettingsActions';
import { elementToHomescreen } from '@suite-utils/homescreen';
import { Dispatch, AcquiredDevice } from '@suite-types';

type AnyImageName = typeof homescreensT1[number] | typeof homescreensT2[number];

/* uuurgh, shall we have this solved on one place? now we have modal wrapper in probably each modal */
const ModalWrapper = styled.div`
    padding: 30px 45px;
    /* width: 356px; */
`;

const BackgroundGalleryT2 = styled.div`
    display: flex;
    flex-wrap: wrap;
    max-width: 200px;
    margin-right: 10px;
`;

const BackgroundGalleryT1 = styled.div`
    display: flex;
    flex-wrap: wrap;
    max-width: 490px;
    margin-right: 10px;
`;

const BackgroundImageT2 = styled.img`
    border-radius: 50%;
    margin: 5px;
    width: 30px;
    height: 30px;
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

const BackgroundGallery = ({ device, applySettings }: Props) => {
    const setHomescreen = (image: AnyImageName) => {
        const element = document.getElementById(image);
        if (element instanceof HTMLImageElement) {
            const hex = elementToHomescreen(element, device.features.major_version);
            applySettings({ homescreen: hex, device });
        }
    };

    return (
        <ModalWrapper>
            <H2>
                <Translation {...messages.TR_BACKGROUND_GALLERY} />
            </H2>

            {device.features.major_version === 1 && (
                <BackgroundGalleryT1>
                    {homescreensT1.map(image => (
                        <BackgroundImageT1
                            key={image}
                            id={image}
                            onClick={() => setHomescreen(image)}
                            src={resolveStaticPath(`images/suite/homescreens/t1/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryT1>
            )}
            {device.features.major_version === 2 && (
                <BackgroundGalleryT2>
                    {homescreensT2.map(image => (
                        <BackgroundImageT2
                            key={image}
                            id={image}
                            onClick={() => setHomescreen(image)}
                            src={resolveStaticPath(`images/suite/homescreens/t2/${image}.png`)}
                        />
                    ))}
                </BackgroundGalleryT2>
            )}
        </ModalWrapper>
    );
};

export default connect(null, mapDispatchToProps)(BackgroundGallery);
