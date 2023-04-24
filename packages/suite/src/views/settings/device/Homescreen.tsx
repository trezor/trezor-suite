import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { HOMESCREEN_EDITOR_URL } from '@trezor/urls';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Tooltip, variables } from '@trezor/components';
import { useDevice, useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { DeviceModel, getDeviceModel } from '@trezor/device-utils';
import {
    deviceModelInformation,
    imagePathToHex,
    fileToDataUrl,
    ImageValidationError,
    validateImage,
    dataUrlToImage,
    isHomescreenSupportedOnDevice,
} from '@suite-utils/homescreen';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';
import { analytics, EventType } from '@trezor/suite-analytics';

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
    const { device } = useDevice();
    const { applySettings, openModal } = useActions({
        applySettings: deviceSettingsActions.applySettings,
        openModal: modalActions.openModal,
    });
    const fileInputElement = useRef<HTMLInputElement>(null);
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
        const file = files[0];

        const validationResult = await validateImage(file, deviceModel);
        setValidationError(validationResult);

        const dataUrl = await fileToDataUrl(file);
        setCustomHomescreen(dataUrl);

        reportImageUploadToAnalytics(dataUrl, file);
    };

    const onChangeHomescreen = async () => {
        const hex = await imagePathToHex(customHomescreen, deviceModel);

        await applySettings({
            homescreen: hex,
        });
        resetUpload();
    };

    const isSupportedHomescreen = isHomescreenSupportedOnDevice(device);

    return (
        <>
            <SectionItem
                data-test="@settings/device/homescreen"
                ref={anchorRef}
                shouldHighlight={shouldHighlight}
            >
                {[DeviceModel.T1, DeviceModel.T2B1].includes(deviceModel) && (
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
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_COLOR_240x240" />
                        }
                    />
                )}
                <ActionColumn>
                    <HiddenInput
                        ref={fileInputElement}
                        type="file"
                        accept={deviceModelInformation[deviceModel].supports
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
                            onClick={() =>
                                openModal({
                                    type: 'device-background-gallery',
                                })
                            }
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
                                        width: deviceModelInformation[deviceModel].width,
                                        height: deviceModelInformation[deviceModel].height,
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
                                width={`${deviceModelInformation[deviceModel].width}px`}
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
