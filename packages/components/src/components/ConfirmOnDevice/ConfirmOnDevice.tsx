import { ReactNode } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Image } from '../Image/Image';
import { variables } from '../../config';
import { Icon } from '../assets/Icon/Icon';
import { DeviceModelInternal } from '@trezor/connect';
import { DeviceAnimation } from '../animations/DeviceAnimation';

enum AnimationDirection {
    Up,
    Down,
}

export const SLIDE_UP = keyframes`
    0% {
        transform: translateY(150%);
    }
    100% {
        transform: translateY(0%);
    }
`;

export const SLIDE_DOWN = keyframes`
    0% {
        transform: translateY(0%);
        opacity: 1;
    }
    100% {
        transform: translateY(150%);
        opacity: 0;
    }
`;

const Wrapper = styled.div<{ animation?: AnimationDirection }>`
    display: flex;
    width: 300px;
    height: 62px;
    padding: 0 14px 0 30px;
    border-radius: 100px;
    background: ${({ theme }) => theme.BG_WHITE};
    box-shadow: 0 2px 5px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
    align-items: center;

    ${({ animation }) =>
        animation === AnimationDirection.Up &&
        css`
            animation: ${SLIDE_UP} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        `}

    ${({ animation }) =>
        animation === AnimationDirection.Down &&
        css`
            animation: ${SLIDE_DOWN} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        `}
`;

const Column = styled.div`
    display: flex;
`;

const Title = styled.div`
    display: flex;
    max-height: 20px;
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.BIG};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
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
    margin-top: 10px;
    max-width: 200px;
    padding: 0 10px;
    justify-content: center;
`;

const CloseWrapper = styled.div`
    width: 34px;
    height: 34px;
    align-items: center;
    justify-content: center;
`;

const Close = styled.div`
    border-radius: 100%;
    cursor: pointer;
    background: ${({ theme }) => theme.STROKE_GREY};
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 1px;
    transition: opacity 0.1s;

    :hover {
        opacity: 0.7;
    }
`;

const Success = styled.div`
    display: flex;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_GREEN};
    text-align: center;
    justify-content: center;
`;

const Step = styled.div<{ isActive: boolean }>`
    width: 18px;
    height: 4px;
    border-radius: 2px;
    margin-right: 6px;
    background: ${({ theme }) => theme.STROKE_GREY};

    ${({ isActive }) =>
        isActive &&
        css`
            background: ${({ theme }) => theme.BG_GREEN};
        `}
`;

const StyledImage = styled(Image)`
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
    isConfirmed?: boolean;
    onCancel?: () => void;
    deviceModelInternal?: DeviceModelInternal;
    deviceUnitColor?: number;
}

export const ConfirmOnDevice = ({
    title,
    steps,
    activeStep,
    onCancel,
    successText,
    isConfirmed,
    deviceModelInternal,
    deviceUnitColor,
}: ConfirmOnDeviceProps) => {
    const hasSteps = steps && activeStep !== undefined;

    return (
        <Wrapper
            animation={isConfirmed ? AnimationDirection.Down : AnimationDirection.Up}
            data-test="@prompts/confirm-on-device"
        >
            <Left>
                {deviceModelInternal === DeviceModelInternal.T2B1 && (
                    <DeviceAnimation
                        type="ROTATE"
                        size={34}
                        deviceModelInternal={deviceModelInternal}
                        deviceUnitColor={deviceUnitColor}
                    />
                )}
                {deviceModelInternal && deviceModelInternal !== DeviceModelInternal.T2B1 && (
                    <StyledImage alt="Trezor" image={`TREZOR_${deviceModelInternal}`} />
                )}
            </Left>

            <Middle>
                <Title>{title}</Title>

                {successText && hasSteps && activeStep > steps && (
                    <Success data-test="@prompts/confirm-on-device/success">{successText}</Success>
                )}

                {hasSteps && activeStep <= steps && (
                    <Steps>
                        {Array.from(Array(steps).keys()).map((step, index) => (
                            <Step
                                key={step}
                                isActive={isStepActive(index, activeStep)}
                                data-test={`@prompts/confirm-on-device/step/${index}${
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
                        <Close onClick={onCancel}>
                            <Icon icon="CROSS" size={23} />
                        </Close>
                    )}
                </CloseWrapper>
            </Right>
        </Wrapper>
    );
};
