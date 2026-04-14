import { type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Column, IconButton, Row, Text } from '@trezor/components';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { borders, spacings, spacingsPx } from '@trezor/theme';

import { RotateDeviceImage } from '../RotateDeviceImage/RotateDeviceImage';

const Step = styled.div<{ $isActive: boolean }>`
    flex: 1;
    height: ${spacingsPx.xxs};
    border-radius: ${borders.radii.xxs};
    background: ${({ theme }) => theme.elementFillNeutralBold};

    ${({ $isActive }) =>
        $isActive &&
        css`
            background: ${({ theme }) => theme.contentBrand};
        `}
`;

const isStepActive = (index: number, activeStep?: number) => {
    if (!activeStep) {
        return false;
    }

    if (!activeStep && index === 0) {
        return true;
    }

    return index < activeStep;
};

export type ConfirmOnDeviceProps = {
    title: ReactNode;
    successText?: ReactNode;
    steps?: number;
    activeStep?: number;
    onCancel?: () => void;
    deviceModelInternal?: DeviceModelInternal;
    deviceUnitColor?: number;
};

export const ConfirmOnDevicePillContent = ({
    title,
    steps = 3,
    activeStep,
    onCancel,
    successText,
    deviceModelInternal,
    deviceUnitColor,
}: ConfirmOnDeviceProps) => {
    const hasSteps = steps && activeStep !== undefined;

    return (
        <Row gap={16}>
            <RotateDeviceImage
                deviceModel={deviceModelInternal}
                deviceColor={deviceUnitColor}
                height={28}
                width={28}
            />

            <Column alignItems="center">
                <Text>{title}</Text>

                {successText && hasSteps && activeStep > steps && (
                    <Text
                        typographyStyle="body-sm-strong"
                        intent="brand"
                        data-testid="@prompts/confirm-on-device/success"
                    >
                        {successText}
                    </Text>
                )}

                {hasSteps && activeStep <= steps && (
                    <Row gap={spacings.xxs} width={70} margin={{ top: spacings.xs }}>
                        {Array.from(Array(steps).keys()).map((step, index) => (
                            <Step
                                key={step}
                                $isActive={isStepActive(index, activeStep)}
                                data-testid={`@prompts/confirm-on-device/step/${index}${
                                    isStepActive(index, activeStep) ? '/active' : ''
                                }`}
                            />
                        ))}
                    </Row>
                )}
            </Column>

            {onCancel && (
                <IconButton
                    icon="x"
                    onClick={onCancel}
                    data-testid="@confirm-on-device/close-button"
                    intent="neutral"
                    priority="secondary"
                    size="small"
                />
            )}
        </Row>
    );
};
