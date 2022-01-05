import React, { createRef, useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { variables } from '@trezor/components';
import { useDevice, useAnalytics, useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { getDeviceModel } from '@suite-utils/device';
import * as homescreen from '@suite-utils/homescreen';

const StyledActionButton = styled(ActionButton)`
    &:not(:first-of-type) {
        @media (max-width: ${variables.SCREEN_SIZE.SM}) {
            margin-top: 10px;
        }
    }
`;

const HiddenInput = styled.input`
    display: none;
`;

const Col = styled.div`
    flex-direction: column;
`;

interface Props {
    isDeviceLocked: boolean;
}

const Homescreen = ({ isDeviceLocked }: Props) => {
    const { device } = useDevice();
    const { applySettings, openModal } = useActions({
        applySettings: deviceSettingsActions.applySettings,
        openModal: modalActions.openModal,
    });
    const analytics = useAnalytics();
    const fileInputElement = createRef<HTMLInputElement>();

    const [customHomescreen, setCustomHomescreen] = useState('');

    if (!device?.features) {
        return null;
    }

    const isModelT = getDeviceModel(device) === 'T';

    const onUploadHomescreen = async (files: FileList | null) => {
        if (!files || !files.length) return;
        const image = files[0];
        const dataUrl = await homescreen.fileToDataUrl(image);

        setCustomHomescreen(dataUrl);

        const imageResolution = await homescreen.getImageResolution(dataUrl);
        analytics.report({
            type: 'settings/device/background',
            payload: {
                format: image.type,
                size: image.size,
                resolutionWidth: imageResolution.width,
                resolutionHeight: imageResolution.height,
            },
        });
    };

    const onSelectCustomHomescreen = async () => {
        const element = document.getElementById('custom-image');
        if (element instanceof HTMLImageElement) {
            const hex = homescreen.elementToHomescreen(element, device.features.major_version);
            await applySettings({ homescreen: hex });
            setCustomHomescreen('');
        }
    };

    return (
        <>
            <SectionItem>
                <TextColumn
                    title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
                    description={
                        // display text only for model T, it relates to what kind of image may be uploaded
                        // but custom upload is enabled only for T now.
                        isModelT ? (
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS" />
                        ) : (
                            ''
                        )
                    }
                />
                <ActionColumn>
                    <HiddenInput
                        ref={fileInputElement}
                        type="file"
                        accept=".png, .jpg"
                        onChange={e => {
                            onUploadHomescreen(e.target.files);
                        }}
                    />
                    {/* only available for model T at the moment. It works quite well there */}
                    {isModelT && (
                        <StyledActionButton
                            onClick={() => {
                                if (fileInputElement.current) {
                                    fileInputElement.current.click();
                                    analytics.report({
                                        type: 'settings/device/goto/background',
                                        payload: { custom: true },
                                    });
                                }
                            }}
                            isDisabled={isDeviceLocked}
                            variant="secondary"
                        >
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE" />
                        </StyledActionButton>
                    )}

                    <StyledActionButton
                        onClick={() => {
                            openModal({
                                type: 'device-background-gallery',
                                device,
                            });
                            analytics.report({
                                type: 'settings/device/goto/background',
                                payload: { custom: false },
                            });
                        }}
                        isDisabled={isDeviceLocked}
                        data-test="@settings/device/select-from-gallery"
                        variant="secondary"
                    >
                        <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY" />
                    </StyledActionButton>
                </ActionColumn>
            </SectionItem>
            {customHomescreen && homescreen.isValid(customHomescreen) && (
                <SectionItem>
                    <Col>
                        <img
                            width="144px"
                            alt="custom homescreen"
                            id="custom-image"
                            src={customHomescreen}
                        />
                    </Col>

                    <ActionColumn>
                        <ActionButton onClick={() => onSelectCustomHomescreen()}>
                            <Translation id="TR_CHANGE_HOMESCREEN" />
                        </ActionButton>
                        <ActionButton
                            variant="secondary"
                            onClick={() => setCustomHomescreen('')}
                            isDisabled={isDeviceLocked}
                        >
                            <Translation id="TR_DROP_IMAGE" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            )}
            {customHomescreen && !homescreen.isValid(customHomescreen) && (
                <SectionItem>
                    <Col>
                        <Translation id="TR_INVALID_FILE_SELECTED" />
                    </Col>
                    <ActionColumn>
                        <ActionButton
                            variant="secondary"
                            onClick={() => setCustomHomescreen('')}
                            isDisabled={isDeviceLocked}
                        >
                            <Translation id="TR_DROP_IMAGE" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            )}
        </>
    );
};
export default Homescreen;
