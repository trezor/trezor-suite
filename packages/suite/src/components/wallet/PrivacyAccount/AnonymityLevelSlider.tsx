import React, { useCallback, ChangeEventHandler } from 'react';
import styled from 'styled-components';
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';
import { Range, Warning, useTheme, motionEasing } from '@trezor/components';
import { Translation } from '@suite-components';
import { useSelector, useAnonymityStatus } from '@suite-hooks';
import { AnonymityStatus } from '@suite-constants/coinjoin';
import { selectSelectedAccount } from '@wallet-reducers/selectedAccountReducer';

const Container = styled.div`
    display: flex;
    flex-direction: column;
`;

const Slider = styled(Range)`
    margin-top: 0;
    cursor: pointer;
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
    position: number;
    setAnonymity: (value: number) => void;
}

export const AnonymityLevelSlider = ({ position, setAnonymity }: AnonymityLevelSliderProps) => {
    const currentAccount = useSelector(selectSelectedAccount);
    const { anonymityStatus } = useAnonymityStatus();

    const theme = useTheme();

    const handleSliderChange: ChangeEventHandler<HTMLInputElement> = useCallback(
        event => {
            const position = Number(event?.target?.value);

            setAnonymity(getValue(position));
        },
        [setAnonymity],
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

    const isErrorDisplayed = anonymityStatus === AnonymityStatus.Bad;

    return (
        <Container>
            <Slider
                value={position}
                onChange={handleSliderChange}
                trackStyle={trackStyle}
                step="any"
                labels={[1, 3, 10, 30, 100]}
                onLabelClick={number => setAnonymity(number)}
            />

            <AnimatePresence initial={!isErrorDisplayed}>
                {isErrorDisplayed && (
                    <motion.div {...expandAnimation}>
                        <Warning critical withIcon>
                            <Translation id="TR_ANONYMITY_LEVEL_BAD_WARNING" />
                        </Warning>
                    </motion.div>
                )}
            </AnimatePresence>
        </Container>
    );
};
