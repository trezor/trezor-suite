import { useRef, useState } from 'react';

import styled from 'styled-components';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Column, Paragraph, Row, Tooltip } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

import { applySettingsThunk } from 'src/actions/settings/deviceSettingsActions';
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

type HomescreenProps = {
    isDeviceLocked: boolean;
};

export const Homescreen = ({ isDeviceLocked }: HomescreenProps) => {
    const [customHomescreen, setCustomHomescreen] = useState('');
    const [validationError, setValidationError] = useState<ImageValidationError | undefined>();

    const { dispatch } = useServices(injectDispatch);
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
        if (!files?.length) return;
        // @ts-expect-error: indexing noUncheckedIndexedAccess
        let currentFile: File = files[0];
        let validationResult = await validateImage({ file: currentFile, deviceModelInternal });

        // Do NOT touch the image if it's already valid
        if (validationResult) {
            currentFile =
                (await convertImage({ file: currentFile, deviceModelInternal })) ?? currentFile;
            validationResult = await validateImage({ file: currentFile, deviceModelInternal });
        }

        setValidationError(validationResult);

        const dataUrl = await fileToDataUrl(currentFile);
        setCustomHomescreen(dataUrl);
    };

    const onChangeHomescreen = async () => {
        const hex = await imagePathToHex(customHomescreen, deviceModelInternal);

        await dispatch(applySettingsThunk({ homescreen: hex }));
        resetUpload();
    };

    const isSupportedHomescreen = isHomescreenSupportedOnDevice(device);

    const cancelButton = (
        <SectionItem.Button
            intent="neutral"
            priority="secondary"
            onClick={resetUpload}
            isDisabled={isDeviceLocked}
            isTooltipActive={isDeviceLocked}
            tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
        >
            <Translation id="TR_CANCEL" />
        </SectionItem.Button>
    );

    return (
        <>
            <Anchor anchorId={SettingsAnchor.Homescreen}>
                {({ anchorId, anchorRef, shouldHighlight }) => (
                    <SectionItem
                        data-testid={anchorId}
                        ref={anchorRef}
                        shouldHighlight={shouldHighlight}
                    >
                        <HomescreenSettingsTitle deviceModelInternal={deviceModelInternal} />

                        <Row flex="1" gap={8} flexWrap="wrap" justifyContent="flex-end">
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
                        </Row>
                    </SectionItem>
                )}
            </Anchor>
            {customHomescreen && !validationError && (
                <SectionItem>
                    <Column>
                        <img
                            width="144px"
                            alt="custom homescreen"
                            id="custom-image"
                            src={customHomescreen}
                        />
                    </Column>

                    <Row flex="1" gap={8} flexWrap="wrap" justifyContent="flex-end">
                        <SectionItem.Button
                            onClick={onChangeHomescreen}
                            isDisabled={isDeviceLocked}
                        >
                            <Translation id="TR_CHANGE_HOMESCREEN" />
                        </SectionItem.Button>
                        {cancelButton}
                    </Row>
                </SectionItem>
            )}
            {customHomescreen && validationError && (
                <SectionItem>
                    <Column flex="1" gap={12} alignItems="flex-start">
                        <Paragraph typographyStyle="body-md">
                            <Translation id="TR_CUSTOM_HOMESCREEN" />
                        </Paragraph>
                        <Paragraph typographyStyle="body-md" intent="warning">
                            <Translation
                                id={validationError}
                                values={{
                                    width: deviceModelInformation[deviceModelInternal].width,
                                    height: deviceModelInformation[deviceModelInternal].height,
                                    maxImageSize:
                                        deviceModelInformation[deviceModelInternal].maxImageSize /
                                        1024,
                                }}
                            />
                        </Paragraph>
                    </Column>

                    {![
                        ImageValidationError.InvalidFormatOnlyJpg,
                        ImageValidationError.InvalidFormatOnlyPngJpg,
                    ].includes(validationError) && (
                        <Column>
                            <img
                                width={`${deviceModelInformation[deviceModelInternal].width}px`}
                                alt="Custom homescreen"
                                id="custom-image"
                                src={customHomescreen}
                            />
                        </Column>
                    )}
                    <Row flex="1" gap={8} flexWrap="wrap" justifyContent="flex-end">
                        {cancelButton}
                    </Row>
                </SectionItem>
            )}
        </>
    );
};
