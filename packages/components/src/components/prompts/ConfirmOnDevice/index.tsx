import React from 'react';
import styled, { css } from 'styled-components';
import { Image } from '../../Image/Image';
import { variables, animations } from '../../../config';
import { type DeviceModel } from '@trezor/device-utils';
import { Icon } from '../../Icon';

enum AnimationDirection {
    Up,
    Down,
}

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
            animation: ${animations.SLIDE_UP} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        `}

    ${({ animation }) =>
        animation === AnimationDirection.Down &&
        css`
            animation: ${animations.SLIDE_DOWN} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
    title: React.ReactNode;
    successText?: React.ReactNode;
    deviceModel: DeviceModel;
    steps?: number;
    activeStep?: number;
    isConfirmed?: boolean;
    onCancel?: () => void;
}

export const ConfirmOnDevice = ({
    title,
    steps,
    activeStep,
    onCancel,
    deviceModel,
    successText,
    isConfirmed,
}: ConfirmOnDeviceProps) => {
    const hasSteps = steps && activeStep !== undefined;

    return (
        <Wrapper
            animation={isConfirmed ? AnimationDirection.Down : AnimationDirection.Up}
            data-test="@prompts/confirm-on-device"
        >
            <Left>
                {deviceModel && <StyledImage alt="Trezor" image={`TREZOR_T${deviceModel}`} />}
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
