import React, { createRef, useState } from 'react';
import styled from 'styled-components';
import { HOMESCREEN_EDITOR_URL } from '@trezor/urls';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { variables } from '@trezor/components';
import { useDevice, useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { DeviceModel, getDeviceModel } from '@trezor/device-utils';
import {
    elementToHomescreen,
    fileToDataUrl,
    getImageResolution,
    ImageValidationError,
    validate,
} from '@suite-utils/homescreen';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

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

const ValidationMessage = styled.div`
    color: ${props => props.theme.TYPE_ORANGE};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface HomescreenProps {
    isDeviceLocked: boolean;
}

export const Homescreen = ({ isDeviceLocked }: HomescreenProps) => {
    const { device } = useDevice();
    const { applySettings, openModal } = useActions({
        applySettings: deviceSettingsActions.applySettings,
        openModal: modalActions.openModal,
    });
    const fileInputElement = createRef<HTMLInputElement>();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Homescreen);

    const [customHomescreen, setCustomHomescreen] = useState('');
    const [validationError, setValidationError] = useState<ImageValidationError | undefined>();

    if (!device?.features) {
        return null;
    }

    const deviceModel = getDeviceModel(device);

    const resetUpload = () => {
        setCustomHomescreen('');
        if (fileInputElement.current) {
            fileInputElement.current.value = '';
        }
    };

    const onUploadHomescreen = async (files: FileList | null) => {
        if (!files || !files.length) return;
        const image = files[0];
        const dataUrl = await fileToDataUrl(image);

        const validationResult = await validate(dataUrl, deviceModel);
        setValidationError(validationResult);

        setCustomHomescreen(dataUrl);

        const imageResolution = await getImageResolution(dataUrl);
        analytics.report({
            type: EventType.SettingsDeviceBackground,
            payload: {
                format: image.type,
                size: image.size,
                resolutionWidth: imageResolution.width,
                resolutionHeight: imageResolution.height,
            },
        });
        resetUpload();
    };

    const onSelectCustomHomescreen = async () => {
        const element = document.getElementById('custom-image');
        if (element instanceof HTMLImageElement) {
            const hex = elementToHomescreen(element, deviceModel);
            await applySettings({ homescreen: hex });
            setCustomHomescreen('');
        }
    };

    return (
        <>
            <SectionItem
                data-test="@settings/device/homescreen"
                ref={anchorRef}
                shouldHighlight={shouldHighlight}
            >
                {[DeviceModel.T1, DeviceModel.TR].includes(deviceModel) && (
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
                        description={
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_BW_128x64" />
                        }
                        buttonLink={HOMESCREEN_EDITOR_URL}
                        buttonTitle={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_EDITOR" />}
                    />
                )}

                {DeviceModel.TT === deviceModel && (
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
                        description={
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_COLOR_144x144" />
                        }
                    />
                )}
                <ActionColumn>
                    <HiddenInput
                        ref={fileInputElement}
                        type="file"
                        accept=".png, .jpg"
                        onChange={e => {
                            onUploadHomescreen(e.target.files);
                        }}
                    />
                    <StyledActionButton
                        onClick={() => {
                            if (fileInputElement.current) {
                                fileInputElement.current.click();
                            }
                        }}
                        isDisabled={isDeviceLocked}
                        variant="secondary"
                    >
                        <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE" />
                    </StyledActionButton>
                    <StyledActionButton
                        onClick={() =>
                            openModal({
                                type: 'device-background-gallery',
                                device,
                            })
                        }
                        isDisabled={isDeviceLocked}
                        data-test="@settings/device/select-from-gallery"
                        variant="secondary"
                    >
                        <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY" />
                    </StyledActionButton>
                </ActionColumn>
            </SectionItem>
            {customHomescreen && !validationError && (
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
                            onClick={resetUpload}
                            isDisabled={isDeviceLocked}
                        >
                            <Translation id="TR_DROP_IMAGE" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            )}
            {customHomescreen && validationError && (
                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_CUSTOM_HOMESCREEN" />}
                        description={
                            <ValidationMessage>
                                <Translation id={validationError} />
                            </ValidationMessage>
                        }
                    />

                    {validationError !== ImageValidationError.InvalidFormat && (
                        <Col>
                            <img
                                width="144px"
                                alt="custom homescreen"
                                id="custom-image"
                                src={customHomescreen}
                            />
                        </Col>
                    )}
                    <ActionColumn>
                        <ActionButton
                            variant="secondary"
                            onClick={resetUpload}
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
