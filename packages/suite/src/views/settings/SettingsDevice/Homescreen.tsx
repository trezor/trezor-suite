import { useRef, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { Paragraph, Tooltip } from '@trezor/components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDevice, useDispatch } from 'src/hooks/suite';
import {
    ImageValidationError,
    convertImage,
    deviceModelInformation,
    fileToDataUrl,
    imagePathToHex,
    isHomescreenSupportedOnDevice,
    validateImage,
} from 'src/utils/suite/homescreen';

import { ChangeHomescreenButtons } from './Homescreen/ChangeHomescreenButtons';
import { HomescreenSettingsTitle } from './Homescreen/HomescreenSettingsTitle';

const HiddenInput = styled.input`
    display: none;
`;

const Col = styled.div`
    flex-direction: column;
`;

type HomescreenProps = {
    isDeviceLocked: boolean;
};

export const Homescreen = ({ isDeviceLocked }: HomescreenProps) => {
    const [customHomescreen, setCustomHomescreen] = useState('');
    const [validationError, setValidationError] = useState<ImageValidationError | undefined>();

    const dispatch = useDispatch();
    const { device } = useDevice();
    const fileInputElement = useRef<HTMLInputElement>(null);

    if (!device?.features) {
        return null;
    }

    const deviceModelInternal = device.features.internal_model;
    if (!deviceModelInformation[deviceModelInternal]) {
        // disallow homescreen updates for unknown/custom models
        return null;
    }

    const resetUpload = () => {
        setCustomHomescreen('');
        if (fileInputElement.current) {
            fileInputElement.current.value = '';
        }
    };

    const onUploadHomescreen = async (files: FileList | null) => {
        if (!files || !files.length) return;
        let file = files[0];

        let validationResult = await validateImage({ file, deviceModelInternal });

        // Do NOT touch the image if it's already valid
        if (validationResult) {
            file = (await convertImage({ file, deviceModelInternal })) ?? file;
            validationResult = await validateImage({ file, deviceModelInternal });
        }

        setValidationError(validationResult);

        const dataUrl = await fileToDataUrl(file);
        setCustomHomescreen(dataUrl);
    };

    const onChangeHomescreen = async () => {
        const hex = await imagePathToHex(customHomescreen, deviceModelInternal);

        await dispatch(applySettings({ homescreen: hex }));
        resetUpload();
    };

    const isSupportedHomescreen = isHomescreenSupportedOnDevice(device);

    const cancelButton = (
        <ActionButton
            intent="neutral"
            priority="secondary"
            onClick={resetUpload}
            isDisabled={isDeviceLocked}
            isTooltipActive={isDeviceLocked}
            tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
        >
            <Translation id="TR_CANCEL" />
        </ActionButton>
    );

    return (
        <>
            <SettingsSectionItem anchorId={SettingsAnchor.Homescreen}>
                <HomescreenSettingsTitle deviceModelInternal={deviceModelInternal} />

                <ActionColumn>
                    <HiddenInput
                        ref={fileInputElement}
                        type="file"
                        accept={['png', 'jpeg', 'gif', 'webp', 'svg+xml']
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
                        <ChangeHomescreenButtons
                            deviceModelInternal={deviceModelInternal}
                            isDeviceLocked={isDeviceLocked}
                            isSupportedHomescreen={isSupportedHomescreen}
                            onImageUploadClick={() => fileInputElement?.current?.click()}
                        />
                    </Tooltip>
                </ActionColumn>
            </SettingsSectionItem>
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
                        <ActionButton onClick={onChangeHomescreen} isDisabled={isDeviceLocked}>
                            <Translation id="TR_CHANGE_HOMESCREEN" />
                        </ActionButton>
                        {cancelButton}
                    </ActionColumn>
                </SectionItem>
            )}
            {customHomescreen && validationError && (
                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_CUSTOM_HOMESCREEN" />}
                        description={
                            <Paragraph typographyStyle="body-md" intent="warning">
                                <Translation
                                    id={validationError}
                                    values={{
                                        width: deviceModelInformation[deviceModelInternal].width,
                                        height: deviceModelInformation[deviceModelInternal].height,
                                        maxImageSize:
                                            deviceModelInformation[deviceModelInternal]
                                                .maxImageSize / 1024,
                                    }}
                                />
                            </Paragraph>
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
                    <ActionColumn>{cancelButton}</ActionColumn>
                </SectionItem>
            )}
        </>
    );
};
