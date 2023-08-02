import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { HOMESCREEN_EDITOR_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { Tooltip, variables } from '@trezor/components';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import {
    deviceModelInformation,
    imagePathToHex,
    fileToDataUrl,
    ImageValidationError,
    validateImage,
    dataUrlToImage,
    isHomescreenSupportedOnDevice,
} from 'src/utils/suite/homescreen';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { analytics, EventType } from '@trezor/suite-analytics';
import { DeviceModelInternal } from '@trezor/connect';

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
    color: ${({ theme }) => theme.TYPE_ORANGE};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const reportImageUploadToAnalytics = async (dataUrl: string, file: File) => {
    const image = await dataUrlToImage(dataUrl);

    analytics.report({
        type: EventType.SettingsDeviceBackground,
        payload: {
            format: file.type,
            size: file.size,
            resolutionWidth: image.width,
            resolutionHeight: image.height,
        },
    });
};

interface HomescreenProps {
    isDeviceLocked: boolean;
}

export const Homescreen = ({ isDeviceLocked }: HomescreenProps) => {
    const [customHomescreen, setCustomHomescreen] = useState('');
    const [validationError, setValidationError] = useState<ImageValidationError | undefined>();

    const dispatch = useDispatch();
    const { device } = useDevice();
    const fileInputElement = useRef<HTMLInputElement>(null);
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Homescreen);

    if (!device?.features) {
        return null;
    }

    const deviceModelInternal = device.features.internal_model;

    const resetUpload = () => {
        setCustomHomescreen('');
        if (fileInputElement.current) {
            fileInputElement.current.value = '';
        }
    };

    const onUploadHomescreen = async (files: FileList | null) => {
        if (!files || !files.length) return;
        const file = files[0];

        const validationResult = await validateImage(file, deviceModelInternal);
        setValidationError(validationResult);

        const dataUrl = await fileToDataUrl(file);
        setCustomHomescreen(dataUrl);

        reportImageUploadToAnalytics(dataUrl, file);
    };

    const onChangeHomescreen = async () => {
        const hex = await imagePathToHex(customHomescreen, deviceModelInternal);

        await dispatch(applySettings({ homescreen: hex }));
        resetUpload();
    };

    const openGallery = () => dispatch(openModal({ type: 'device-background-gallery' }));

    const isSupportedHomescreen = isHomescreenSupportedOnDevice(device);

    return (
        <>
            <SectionItem
                data-test="@settings/device/homescreen"
                ref={anchorRef}
                shouldHighlight={shouldHighlight}
            >
                {[DeviceModelInternal.T1B1, DeviceModelInternal.T2B1].includes(
                    deviceModelInternal,
                ) && (
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
                        description={
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_BW_128x64" />
                        }
                        buttonLink={HOMESCREEN_EDITOR_URL}
                        buttonTitle={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_EDITOR" />}
                    />
                )}

                {DeviceModelInternal.T2T1 === deviceModelInternal && (
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
                        description={
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_COLOR_240x240" />
                        }
                    />
                )}
                <ActionColumn>
                    <HiddenInput
                        ref={fileInputElement}
                        type="file"
                        accept={deviceModelInformation[deviceModelInternal].supports
                            .map(format => `image/${format}`)
                            .join(', ')}
                        onChange={e => onUploadHomescreen(e.target.files)}
                    />
                    <Tooltip
                        maxWidth={285}
                        content={
                            !isSupportedHomescreen && (
                                <Translation id="TR_UPDATE_FIRMWARE_HOMESCREEN_TOOLTIP" />
                            )
                        }
                    >
                        <StyledActionButton
                            onClick={() => fileInputElement?.current?.click()}
                            isDisabled={isDeviceLocked || !isSupportedHomescreen}
                            variant="secondary"
                            data-test="@settings/device/homescreen-upload"
                        >
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE" />
                        </StyledActionButton>
                    </Tooltip>
                    <Tooltip
                        maxWidth={285}
                        content={
                            !isSupportedHomescreen && (
                                <Translation id="TR_UPDATE_FIRMWARE_HOMESCREEN_TOOLTIP" />
                            )
                        }
                    >
                        <StyledActionButton
                            onClick={openGallery}
                            isDisabled={isDeviceLocked || !isSupportedHomescreen}
                            data-test="@settings/device/homescreen-gallery"
                            variant="secondary"
                        >
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY" />
                        </StyledActionButton>
                    </Tooltip>
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
                        <ActionButton onClick={onChangeHomescreen}>
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
                                <Translation
                                    id={validationError}
                                    values={{
                                        width: deviceModelInformation[deviceModelInternal].width,
                                        height: deviceModelInformation[deviceModelInternal].height,
                                    }}
                                />
                            </ValidationMessage>
                        }
                    />

                    {![
                        ImageValidationError.InvalidFormatOnlyJpg,
                        ImageValidationError.InvalidFormatOnlyPngJpg,
                    ].includes(validationError) && (
                        <Col>
                            <img
                                width={`${deviceModelInformation[deviceModelInternal].width}px`}
                                alt="Custom homescreen"
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
