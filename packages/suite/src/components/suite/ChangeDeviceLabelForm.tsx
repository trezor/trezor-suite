import { Controller, useController } from 'react-hook-form';

import styled from 'styled-components';

import { selectDeviceLabel, selectDeviceName } from '@suite-common/wallet-core';
import { Button, Input, Tooltip } from '@trezor/components';
import { breakpointMediaQueries } from '@trezor/styles';
import { spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

const Container = styled.form<{ $isVertical?: boolean }>`
    display: flex;
    flex-direction: ${({ $isVertical }) => ($isVertical ? 'column' : 'row')};
    align-items: center;
    gap: ${spacingsPx.sm};
    min-width: ${({ $isVertical }) => $isVertical && '200px'};

    ${breakpointMediaQueries.below_sm} {
        min-width: ${({ $isVertical }) => $isVertical && '100%'};
    }
`;

type ChangeDeviceLabelProps = {
    isDeviceLocked: boolean;
    isVertical?: boolean;
    onClick?: () => void;
};

export const ChangeDeviceLabelForm = ({
    isDeviceLocked,
    isVertical,
    onClick,
}: ChangeDeviceLabelProps) => {
    const deviceLabel = useSelector(selectDeviceLabel);
    const deviceName = useSelector(selectDeviceName);

    const { field, fieldState } = useController({
        name: 'deviceLabel',
    });

    const isDisabled =
        isDeviceLocked || !field.value || field.value === deviceName || !!fieldState.error;
    const placeholder = !deviceLabel ? deviceName : undefined;

    return (
        <Container $isVertical={isVertical}>
            <Controller
                name="deviceLabel"
                render={({ field: { value, onChange }, fieldState }) => (
                    <Input
                        value={value}
                        placeholder={placeholder}
                        onChange={onChange}
                        inputState={fieldState.error && 'error'}
                        size={isVertical ? 'small' : 'large'}
                        bottomText={fieldState.error?.message ?? null}
                        data-testid="@settings/device/label-input"
                    />
                )}
            />

            <Tooltip
                isActive={isDeviceLocked}
                content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                isFullWidth
            >
                <Button
                    onClick={onClick}
                    isDisabled={isDisabled}
                    data-testid="@settings/device/label-submit"
                    size={isVertical ? 'small' : 'large'}
                    isFullWidth
                    type="submit"
                >
                    <Translation id="TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL" />
                </Button>
            </Tooltip>
        </Container>
    );
};
