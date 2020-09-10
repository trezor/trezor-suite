import React from 'react';
import styled, { css } from 'styled-components';
import { DeviceImage } from '../../DeviceImage';
import { Icon } from '../../Icon';
import { colors, variables } from '../../../config';

const Wrapper = styled.div`
    display: flex;
    width: 300px;
    height: 62px;
    padding: 0 10px 0 30px;
    border-radius: 100px;
    background: white;
    box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.19);
    align-items: center;
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
    background: ${colors.NEUE_STROKE_GREY};
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 1px;
`;

const Success = styled.div`
    display: flex;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.NEUE_TYPE_GREEN};
    text-align: center;
    justify-content: center;
`;

const Step = styled.div<{ isActive: boolean }>`
    width: 18px;
    height: 4px;
    border-radius: 2px;
    margin-right: 6px;
    background: ${colors.NEUE_STROKE_GREY};

    ${props =>
        props.isActive &&
        css`
            background: ${colors.NEUE_BG_GREEN};
        `}
`;

const isStepActive = (index: number, activeStep?: number) => {
    if (!activeStep) return false;

    if (!activeStep && index === 0) {
        return true;
    }

    return index < activeStep;
};

interface Props {
    title: React.ReactNode;
    successText: React.ReactNode;
    trezorModel: 1 | 2;
    steps?: number;
    activeStep?: number;
    onCancel?: () => void;
}

const ConfirmOnDevice = ({
    title,
    steps,
    activeStep,
    onCancel,
    trezorModel,
    successText,
}: Props) => {
    return (
        <Wrapper>
            <Left>
                <DeviceImage height="34px" trezorModel={trezorModel} />
            </Left>
            <Middle>
                <Title>{title}</Title>
                {typeof steps === 'number' && activeStep && activeStep > steps && (
                    <Success>{successText}</Success>
                )}
                {typeof steps === 'number' && activeStep && activeStep <= steps && (
                    <Steps>
                        {[...Array(steps)].map((s, i) => (
                            <Step key={s} isActive={isStepActive(i, activeStep)} />
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

export { ConfirmOnDevice, Props as ConfirmOnDeviceProps };
