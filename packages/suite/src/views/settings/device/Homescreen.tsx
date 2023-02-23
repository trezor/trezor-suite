import React, { createRef, useState } from 'react';
import styled from 'styled-components';
import { HOMESCREEN_EDITOR_URL } from '@trezor/urls';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Tooltip, variables } from '@trezor/components';
import { useDevice, useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { DeviceModel, getDeviceModel, getFirmwareVersion } from '@trezor/device-utils';
import {
    deviceModelInformation,
    elementToHomescreen,
    fileToDataUrl,
    getImageResolution,
    ImageValidationError,
    reportImageUploadToAnalytics,
    validateImage,
} from '@suite-utils/homescreen';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';
import { versionUtils } from '@trezor/utils';

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

        const validationResult = await validateImage(file, deviceModel);
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

    const isSupportedHomescreen =
        deviceModel !== DeviceModel.TT ||
        (deviceModel === DeviceModel.TT && device.features.homescreen_format === 'Jpeg240x240');

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
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_COLOR_240x240" />
                        }
                    />
                )}
                <ActionColumn>
                    <HiddenInput
                        ref={fileInputElement}
                        type="file"
                        accept={deviceModelInformation[deviceModel].supports.join(', ')}
                        onChange={e => {
                            onUploadHomescreen(e.target.files);
                        }}
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
                                    device,
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
                                <Translation id={validationError} />
                            </ValidationMessage>
                        }
                    />

                    {validationError !== ImageValidationError.InvalidFormat && (
                        <Col>
                            <img
                                width={`${deviceModelInformation[DeviceModel.T1].width}px`}
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
