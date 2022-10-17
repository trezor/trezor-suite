import React, { useCallback, useState, ChangeEventHandler } from 'react';
import styled from 'styled-components';
import { Range, P, Warning, variables, useTheme } from '@trezor/components';
import { Translation } from '@suite-components';
import { useSelector, useActions, useAnonymityStatus } from '@suite-hooks';
import { AnonymityStatus } from '@suite-constants/coinjoin';
import { selectSelectedAccount } from '@wallet-reducers/selectedAccountReducer';
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

const Label = styled(P)<{ $offset?: number }>`
    position: relative;
    left: ${({ $offset }) => $offset ?? 0}px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    opacity: 0.5;
`;

const WarningWrapper = styled.div`
    margin-top: 24px;
    margin-bottom: -14px;
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
    const { anonymityStatus, targetAnonymity } = useAnonymityStatus();

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
                <Label $offset={7}>10</Label>
                <Label>30</Label>
                <Label>100</Label>
            </LabelsWrapper>
            {anonymityStatus === AnonymityStatus.Bad && (
                <WarningWrapper>
                    <Warning critical withIcon>
                        <Translation id="TR_ANONYMITY_LEVEL_BAD_WARNING" />
                    </Warning>
                </WarningWrapper>
            )}
        </Container>
    );
};
