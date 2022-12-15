import React, { useCallback, ChangeEventHandler, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';
import { Range, Warning, useTheme, motionEasing, Icon, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { useAnonymityStatus } from '@suite-hooks';
import { AnonymityStatus } from '@suite-constants/coinjoin';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
`;

const blurredStyle = css<{ $isBlurred: boolean }>`
    transition: filter 0.15s;
    filter: ${({ $isBlurred }) => $isBlurred && 'blur(7px)'};
`;

const AnonymityRange = styled(Range)<{ $isBlurred: boolean }>`
    ${blurredStyle}
`;

const Label = styled.span`
    display: flex;
    align-items: center;

    > :first-child {
        margin-right: 3px;
    }
`;

const DisabledMessage = styled.div`
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    backdrop-filter: grayscale(0.5);
    filter: ${({ theme }) => `drop-shadow(0px 0px 8px ${theme.BG_LIGHT_GREY})`};

    > :first-child {
        margin-right: 6px;
    }
`;

const RedText = styled.span`
    margin-right: 2px;
    color: ${({ theme }) => theme.TYPE_RED};
`;

const AnonymityWarning = styled(Warning)`
    ${blurredStyle}
`;

const expandAnimation: HTMLMotionProps<'div'> = {
    initial: { height: 0, marginTop: 0, opacity: 0 },
    animate: { height: 48, marginTop: 24, opacity: 1 },
    exit: { height: 0, marginTop: 0, opacity: 0 },
    transition: {
        duration: 0.3,
        ease: motionEasing.transition,
    },
};

const minPosition = 0;
const maxPosition = 100;

const minValue = Math.log(1);
const maxValue = Math.log(100);

const scale = (maxValue - minValue) / (maxPosition - minPosition);

export const getValue = (position: number) =>
    Math.round(Math.exp((position - minPosition) * scale + minValue));
export const getPosition = (value: number) => minPosition + (Math.log(value) - minValue) / scale;

interface AnonymityLevelSliderProps {
    isSessionActive: boolean;
    position: number;
    handleChange: (value: number) => void;
}

export const AnonymityLevelSlider = ({
    isSessionActive,
    position,
    handleChange,
}: AnonymityLevelSliderProps) => {
    const { anonymityStatus } = useAnonymityStatus();

    const theme = useTheme();

    const handleSliderChange: ChangeEventHandler<HTMLInputElement> = useCallback(
        event => {
            const position = Number(event?.target?.value);

            if (Number.isNaN(position)) {
                return;
            }

            handleChange(getValue(position));
        },
        [handleChange],
    );

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

    const isErrorDisplayed = anonymityStatus === AnonymityStatus.Bad;

    const labels = useMemo(
        () => [
            {
                value: 1,
                component: (
                    <Label>
                        <Icon icon="ONE_USER" size={14} color={theme.TYPE_DARK_GREY} /> 1
                    </Label>
                ),
            },
            {
                value: 3,
                component: (
                    <Label>
                        <Icon icon="TWO_USERS" size={14} color={theme.TYPE_DARK_GREY} /> 3
                    </Label>
                ),
            },
            {
                value: 10,
                component: (
                    <Label>
                        <Icon icon="THREE_USERS" size={14} color={theme.TYPE_DARK_GREY} /> 10
                    </Label>
                ),
            },
            {
                value: 30,
                component: (
                    <Label>
                        <Icon icon="FOUR_USERS" size={14} color={theme.TYPE_DARK_GREY} /> 30
                    </Label>
                ),
            },
            {
                value: 100,
                component: (
                    <Label>
                        <Icon icon="FOUR_USERS" size={14} color={theme.TYPE_DARK_GREY} /> 100
                    </Label>
                ),
            },
        ],
        [theme],
    );

    return (
        <Container>
            <AnonymityRange
                value={position}
                onChange={handleSliderChange}
                trackStyle={trackStyle}
                step="any"
                labels={labels}
                onLabelClick={number => handleChange(number)}
                $isBlurred={isSessionActive}
            />

            <AnimatePresence initial={!isErrorDisplayed}>
                {isErrorDisplayed && (
                    <motion.div {...expandAnimation}>
                        <AnonymityWarning critical withIcon $isBlurred={isSessionActive}>
                            <Translation
                                values={{
                                    red: chunks => <RedText>{chunks}</RedText>,
                                }}
                                id="TR_LOW_ANONYMITY_WARNING"
                            />
                        </AnonymityWarning>
                    </motion.div>
                )}
            </AnimatePresence>

            {isSessionActive && (
                <DisabledMessage>
                    <Icon icon="INFO" size={14} color={theme.TYPE_DARK_GREY} />
                    <Translation id="TR_DISABLED_ANONYMITY_CHANGE_MESSAGE" />
                </DisabledMessage>
            )}
        </Container>
    );
};
