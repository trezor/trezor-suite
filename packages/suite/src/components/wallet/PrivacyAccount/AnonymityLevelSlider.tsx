import React, { useCallback, useState, ChangeEventHandler } from 'react';
import styled from 'styled-components';
import { Range, P, variables, useTheme } from '@trezor/components';
import { useSelector, useActions } from '@suite-hooks';
import { selectSelectedAccount } from '@wallet-reducers/selectedAccountReducer';
import { selectCurrentTargetAnonymity } from '@wallet-reducers/coinjoinReducer';
import * as coinjoinActions from '@wallet-actions/coinjoinAccountActions';

const Container = styled.div`
    display: flex;
    flex-direction: column;
`;

const Slider = styled(Range)`
    padding-bottom: 50px;
    padding-top: 60px;
    margin-top: 0;

    cursor: pointer;
    background: none;
`;

const LabelsWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    pointer-events: none;

    margin-top: -46px;
    margin-bottom: -16px;
    margin-left: 10px;
`;

const Label = styled(P)`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    opacity: 0.5;
`;

const minPosition = 0;
const maxPosition = 100;

const minValue = Math.log(1);
const maxValue = Math.log(100);

const scale = (maxValue - minValue) / (maxPosition - minPosition);

const getValue = (position: number) =>
    Math.round(Math.exp((position - minPosition) * scale + minValue));
const getPosition = (value: number) => minPosition + (Math.log(value) - minValue) / scale;

interface AnonymityLevelSliderProps {
    className?: string;
}

export const AnonymityLevelSlider = ({ className }: AnonymityLevelSliderProps) => {
    const currentAccount = useSelector(selectSelectedAccount);
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity);

    const [sliderPosition, setSliderPosition] = useState(getPosition(targetAnonymity || 1));

    const { coinjoinAccountUpdateAnonymity } = useActions({
        coinjoinAccountUpdateAnonymity: coinjoinActions.coinjoinAccountUpdateAnonymity,
    });

    const theme = useTheme();

    const handleSliderChange: ChangeEventHandler<HTMLInputElement> = useCallback(
        event => {
            const position = Number(event?.target?.value);
            if (!Number.isNaN(position)) {
                coinjoinAccountUpdateAnonymity(currentAccount?.key ?? '', getValue(position));
                setSliderPosition(position);
            }
        },
        [coinjoinAccountUpdateAnonymity, currentAccount?.key],
    );

    if (!currentAccount) {
        return null;
    }

    const trackStyle = {
        background: `\
            linear-gradient(270deg,\
                ${theme.GRADIENT_SLIDER_GREEN_START} 0%,\
                ${theme.GRADIENT_SLIDER_GREEN_END} 45%,\
                ${theme.GRADIENT_SLIDER_YELLOW_START} 55%,\
                ${theme.GRADIENT_SLIDER_YELLOW_END} 60%,\
                ${theme.GRADIENT_SLIDER_RED_END} 100%\
            );`,
    };

    return (
        <Container className={className}>
            <Slider
                value={sliderPosition}
                onChange={handleSliderChange}
                trackStyle={trackStyle}
                step={0.1}
            />
            <LabelsWrapper>
                <Label>1</Label>
                <Label>3</Label>
                <Label>10</Label>
                <Label>30</Label>
                <Label>100</Label>
            </LabelsWrapper>
        </Container>
    );
};
