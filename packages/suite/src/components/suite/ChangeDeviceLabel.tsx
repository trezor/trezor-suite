import React, { useState } from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';
import styled, { css } from 'styled-components';

import { Button, INPUT_HEIGHTS, Input } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDevice, useDispatch, useTranslation } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
import { SCREEN_SIZE } from '@trezor/components/src/config/variables';
import { isAscii } from '@trezor/utils';

const StyledInput = styled(Input)<{ isVertical?: boolean }>`
    width: 170px;

    ${props =>
        props.isVertical &&
        css`
            margin: 4px 0;

            &:not(:first-child) {
                margin-left: 8px;
            }

            @media (max-width: ${SCREEN_SIZE.SM}) {
                width: 100%;
            }
        `};
`;

const StyledButton = styled(Button)<{ isVertical?: boolean; isDisabled: boolean }>`
    height: ${INPUT_HEIGHTS.large}px;

    ${props =>
        props.isVertical &&
        css`
            min-width: 170px;
            margin: 4px 0;
            &:not(:first-child) {
                margin-left: 8px;

                @media (max-width: ${SCREEN_SIZE.SM}) {
                    margin-left: 0;
                }
            }

            @media (max-width: ${SCREEN_SIZE.SM}) {
                width: 100%;
            }
        `}
`;

interface ChangeDeviceLabelProps {
    isDeviceLocked: boolean;
    placeholder?: string;
    isVertical?: boolean;
    onClick?: () => void;
}

export const ChangeDeviceLabel = ({
    isDeviceLocked,
    placeholder,
    isVertical,
    onClick,
}: ChangeDeviceLabelProps) => {
    const { translationString } = useTranslation();
    const { device } = useDevice();
    const dispatch = useDispatch();

    const [label, setLabel] = useState(device?.label === placeholder ? '' : device?.label);
    const [error, setError] = useState<string | null>(null);

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = ({ target: { value } }) => {
        setLabel(value);

        if (value.length > MAX_LABEL_LENGTH) {
            setError(
                translationString('TR_LABEL_ERROR_LENGTH', {
                    length: 16,
                }),
            );
        } else if (!isAscii(value)) {
            setError(translationString('TR_LABEL_ERROR_CHARACTERS'));
        } else {
            setError(null);
        }
    };

    const handleClick = () => {
        dispatch(applySettings({ label }));
        analytics.report({
            type: EventType.SettingsDeviceChangeLabel,
        });
        onClick?.();
    };

    const isDisabled =
        isDeviceLocked || (!placeholder && label === device?.label) || !!error || !label;

    return (
        <>
            <StyledInput
                isVertical={isVertical}
                noTopLabel
                bottomText={error}
                value={label}
                placeholder={placeholder}
                inputState={error ? 'error' : undefined}
                onChange={handleChange}
                data-test="@settings/device/label-input"
                alignInputRight
            />
            <StyledButton
                isVertical={isVertical}
                onClick={handleClick}
                isDisabled={isDisabled}
                data-test="@settings/device/label-submit"
            >
                <Translation id="TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL" />
            </StyledButton>
        </>
    );
};
