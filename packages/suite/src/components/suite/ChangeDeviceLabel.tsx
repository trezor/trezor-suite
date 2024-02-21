import { useState, ChangeEventHandler } from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';
import styled from 'styled-components';

import { Button, Input } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDevice, useDispatch, useTranslation } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
import { isAscii } from '@trezor/utils';
import { spacingsPx } from '@trezor/theme';
import { breakpointMediaQueries } from '@trezor/styles';

const Container = styled.div<{ isVertical?: boolean }>`
    display: flex;
    flex-direction: ${({ isVertical }) => (isVertical ? 'column' : 'row')};
    align-items: center;
    gap: ${spacingsPx.sm};
    min-width: ${({ isVertical }) => isVertical && '200px'};

    ${breakpointMediaQueries.below_sm} {
        min-width: ${({ isVertical }) => isVertical && '100%'};
    }
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

    const handleChange: ChangeEventHandler<HTMLInputElement> = ({ target: { value } }) => {
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
        <Container isVertical={isVertical}>
            <Input
                bottomText={error || null}
                value={label}
                placeholder={placeholder}
                inputState={error ? 'error' : undefined}
                onChange={handleChange}
                data-test-id="@settings/device/label-input"
                hasBottomPadding={false}
                size={isVertical ? 'small' : 'large'}
            />
            <Button
                onClick={handleClick}
                isDisabled={isDisabled}
                data-test-id="@settings/device/label-submit"
                size={isVertical ? 'small' : 'large'}
                isFullWidth
            >
                <Translation id="TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL" />
            </Button>
        </Container>
    );
};
