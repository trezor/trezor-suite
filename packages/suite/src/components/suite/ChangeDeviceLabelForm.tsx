import { Controller, useController } from 'react-hook-form';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectDeviceName, selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { Button, Input, Tooltip } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';

import { useSelector } from 'src/hooks/suite';

const Container = styled.form<{ $isVertical?: boolean }>`
    display: flex;
    flex-direction: ${({ $isVertical }) => ($isVertical ? 'column' : 'row')};
    align-items: center;
    gap: 12px;
    min-width: ${({ $isVertical }) => $isVertical && '200px'};

    ${SCREEN_QUERY.MOBILE} {
        min-width: ${({ $isVertical }) => $isVertical && '100%'};
    }
`;

type ChangeDeviceLabelProps = {
    isDeviceLocked: boolean;
    isVertical?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export const ChangeDeviceLabelForm = ({
    isDeviceLocked,
    isVertical,
    onClick,
}: ChangeDeviceLabelProps) => {
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const deviceName = useSelector(selectDeviceName);

    const { field, fieldState } = useController({
        name: 'deviceLabel',
    });

    const isDisabled =
        isDeviceLocked || !field.value || field.value === deviceLabel || !!fieldState.error;
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
                        hasError={!!fieldState.error}
                        size={isVertical ? 'small' : 'large'}
                        bottomText={fieldState.error?.message ?? null}
                        data-testid="@settings/device/label-input"
                    />
                )}
            />

            <Tooltip
                isActive={isDeviceLocked}
                content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                width="100%"
            >
                <Button
                    onClick={onClick}
                    isDisabled={isDisabled}
                    data-testid="@settings/device/label-submit"
                    size={isVertical ? 'small' : 'large'}
                    width="100%"
                    type="submit"
                >
                    <Translation id="TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL" />
                </Button>
            </Tooltip>
        </Container>
    );
};
