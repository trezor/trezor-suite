import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { P } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { homescreensT1, homescreensT2 } from '@suite-constants';
import { resolveStaticPath } from '@suite-utils/nextjs';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { elementToHomescreen } from '@suite-utils/homescreen';
import { Dispatch, AcquiredDevice } from '@suite-types';

type AnyImageName = typeof homescreensT1[number] | typeof homescreensT2[number];

const ModalWrapper = styled.div`
    padding: 30px 30px;
    height: 450px;
    overflow-y: auto;
`;

const BackgroundGalleryT2 = styled.div`
    display: flex;
    flex-wrap: wrap;
    /* width of T2 image + margin * number of images in row. Plus 1px to make it work :D */
    width: ${(80 + 10) * 4 + 1}px;
`;

const BackgroundGalleryT1 = styled.div`
    display: flex;
    flex-wrap: wrap;
    /* width of T1 image + its margin * number of images wanted in row */
    width: ${(64 + 10) * 5}px;
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

const StyledP = styled(P)`
    font-weight: 18px;
    text-align: left;
    padding-left: 10px;
    margin-bottom: 28px;
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
            applySettings({ homescreen: hex });
        }
    };

    return (
        <ModalWrapper>
            <StyledP>
                <Translation {...messages.TR_BACKGROUND_GALLERY} />
            </StyledP>

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
                            data-test={`@modal/gallery/t2/${image}`}
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
