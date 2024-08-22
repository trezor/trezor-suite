import { ReactNode } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { IconLegacy } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    spacingsPx,
    typography,
} from '@trezor/theme';
import { useElevation } from '@trezor/components';
import { RotateDeviceImage } from '@trezor/components';

const Column = styled.div`
    display: flex;
`;

const Title = styled.div`
    display: flex;
    justify-content: center;
    ${typography.body};
    color: ${({ theme }) => theme.textDefault};
`;

const Left = styled(Column)``;

const Middle = styled(Column)`
    flex: 1;
    justify-content: center;
    flex-direction: column;
`;

const Right = styled(Column)``;

const Steps = styled.div`
    display: flex;
    margin-top: ${spacingsPx.sm};
    max-width: 200px;
    padding: 0 ${spacingsPx.sm};
    justify-content: center;
`;

const CloseWrapper = styled.div`
    margin-left: ${spacingsPx.xs};
`;

const Close = styled.div<{ $elevation: Elevation }>`
    border-radius: 100%;
    cursor: pointer;
    background: ${mapElevationToBackground};
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.1s;

    :hover {
        opacity: 0.7;
    }
`;

const Success = styled.div`
    display: flex;
    flex: 1;
    ${typography.callout}
    color: ${({ theme }) => theme.textPrimaryDefault};
    text-align: center;
    justify-content: center;
`;

const Step = styled.div<{ $isActive: boolean }>`
    width: 18px;
    height: 4px;
    border-radius: ${borders.radii.xxs};
    margin-right: ${spacingsPx.xxs};
    background: ${({ theme }) => theme.backgroundNeutralSubdued};

    ${({ $isActive }) =>
        $isActive &&
        css`
            background: ${({ theme }) => theme.iconPrimaryDefault};
        `}
`;

const StyledRotateDeviceImage = styled(RotateDeviceImage)`
    height: 34px;
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
    steps,
    activeStep,
    onCancel,
    successText,
    deviceModelInternal,
    deviceUnitColor,
}: ConfirmOnDeviceProps) => {
    const { elevation } = useElevation();
    const hasSteps = steps && activeStep !== undefined;
    const theme = useTheme();

    return (
        <>
            <Left>
                <StyledRotateDeviceImage
                    deviceModel={deviceModelInternal}
                    deviceColor={deviceUnitColor}
                    animationHeight="34px"
                    animationWidth="34px"
                />
            </Left>

            <Middle>
                <Title>{title}</Title>

                {successText && hasSteps && activeStep > steps && (
                    <Success data-testid="@prompts/confirm-on-device/success">
                        {successText}
                    </Success>
                )}

                {hasSteps && activeStep <= steps && (
                    <Steps>
                        {Array.from(Array(steps).keys()).map((step, index) => (
                            <Step
                                key={step}
                                $isActive={isStepActive(index, activeStep)}
                                data-testid={`@prompts/confirm-on-device/step/${index}${
                                    isStepActive(index, activeStep) ? '/active' : ''
                                }`}
                            />
                        ))}
                    </Steps>
                )}
            </Middle>

            <Right>
                <CloseWrapper>
                    {onCancel && (
                        <Close
                            $elevation={elevation}
                            onClick={onCancel}
                            data-testid="@confirm-on-device/close-button"
                        >
                            <IconLegacy icon="CROSS" size={16} color={theme.textOnTertiary} />
                        </Close>
                    )}
                </CloseWrapper>
            </Right>
        </>
    );
};
