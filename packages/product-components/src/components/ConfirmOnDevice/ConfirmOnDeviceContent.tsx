import { ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Column, Row, IconButton, Text } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';
import { borders, spacings, spacingsPx } from '@trezor/theme';

import { RotateDeviceImage } from '../RotateDeviceImage/RotateDeviceImage';

const Step = styled.div<{ $isActive: boolean }>`
    flex: 1;
    height: ${spacingsPx.xxs};
    border-radius: ${borders.radii.xxs};
    background: ${({ theme }) => theme.backgroundNeutralSubdued};

    ${({ $isActive }) =>
        $isActive &&
        css`
            background: ${({ theme }) => theme.iconPrimaryDefault};
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

export interface ConfirmOnDeviceProps {
    title: ReactNode;
    successText?: ReactNode;
    steps?: number;
    activeStep?: number;
    onCancel?: () => void;
    deviceModelInternal?: DeviceModelInternal;
    deviceUnitColor?: number;
}

export const ConfirmOnDeviceContent = ({
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
        <Row gap={spacings.xl}>
            <RotateDeviceImage
                deviceModel={deviceModelInternal}
                deviceColor={deviceUnitColor}
                animationHeight="34px"
            />

            <Column alignItems="center">
                <Text>{title}</Text>

                {successText && hasSteps && activeStep > steps && (
                    <Text
                        typographyStyle="callout"
                        variant="primary"
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
                    icon="close"
                    onClick={onCancel}
                    data-testid="@confirm-on-device/close-button"
                    variant="tertiary"
                    size="small"
                />
            )}
        </Row>
    );
};
