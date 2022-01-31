import React, { createRef, useState } from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { variables } from '@trezor/components';
import { useDevice, useAnalytics, useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { getDeviceModel } from '@suite-utils/device';
import {
    elementToHomescreen,
    fileToDataUrl,
    getImageResolution,
    ImageValidationError,
    validate,
} from '@suite-utils/homescreen';
import { HOMESCREEN_EDITOR } from '@suite-constants/urls';
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
    const analytics = useAnalytics();
    const fileInputElement = createRef<HTMLInputElement>();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Homescreen);

    const [customHomescreen, setCustomHomescreen] = useState('');
    const [validationError, setValidationError] = useState<ImageValidationError | undefined>();

    if (!device?.features) {
        return null;
    }

    const isModelT = getDeviceModel(device) === 'T';
    const trezorModel = isModelT ? 2 : 1;

    const onUploadHomescreen = async (files: FileList | null) => {
        if (!files || !files.length) return;
        const image = files[0];
        const dataUrl = await fileToDataUrl(image);

        const validationResult = await validate(dataUrl, trezorModel);
        setValidationError(validationResult);

        setCustomHomescreen(dataUrl);

        const imageResolution = await getImageResolution(dataUrl);
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
            const hex = elementToHomescreen(element, trezorModel);
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
                {isModelT ? (
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
                        description={
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_TT" />
                        }
                    />
                ) : (
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
                        description={
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_T1" />
                        }
                        buttonLink={HOMESCREEN_EDITOR}
                        buttonTitle={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_EDITOR" />}
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
                            onClick={() => setCustomHomescreen('')}
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
