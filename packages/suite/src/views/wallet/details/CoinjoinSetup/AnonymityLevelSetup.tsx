import { useMemo, useState } from 'react';

import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';
import styled, { useTheme } from 'styled-components';

import { Icon, Banner, motionEasing } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { AnonymityStatus } from 'src/constants/suite/coinjoin';
import { useAnonymityStatus, useDispatch } from 'src/hooks/suite';
import { coinjoinAccountUpdateAnonymity } from 'src/actions/wallet/coinjoinAccountActions';

import { SetupSlider } from './SetupSlider/SetupSlider';

const Label = styled.span`
    display: flex;
    align-items: center;
    gap: 2px;
    height: 14px;
`;

const RedText = styled.span`
    margin-right: 2px;
    color: ${({ theme }) => theme.legacy.TYPE_RED};
`;

const expandAnimation: HTMLMotionProps<'div'> = {
    initial: { height: 0, marginTop: 0, opacity: 0 },
    animate: { height: 'auto', marginTop: 24, opacity: 1 },
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

const getValue = (position: number) =>
    Math.round(Math.exp((position - minPosition) * scale + minValue));
const getPosition = (value: number) => minPosition + (Math.log(value) - minValue) / scale;

interface AnonymityLevelSetupProps {
    accountKey: string;
    targetAnonymity: number;
}

export const AnonymityLevelSetup = ({ accountKey, targetAnonymity }: AnonymityLevelSetupProps) => {
    const [sliderPosition, setSliderPosition] = useState(getPosition(targetAnonymity));

    const dispatch = useDispatch();

    const { anonymityStatus } = useAnonymityStatus();

    const theme = useTheme();

    const isErrorDisplayed = anonymityStatus === AnonymityStatus.Bad;

    const trackStyle = {
        background: `\
            linear-gradient(270deg,\
                ${theme.legacy.GRADIENT_SLIDER_GREEN_START} 0%,\
                ${theme.legacy.GRADIENT_SLIDER_GREEN_END} 60%,\
                ${theme.legacy.GRADIENT_SLIDER_YELLOW_START} 70%,\
                ${theme.legacy.GRADIENT_SLIDER_YELLOW_END} 85%,\
                ${theme.legacy.GRADIENT_SLIDER_RED_END} 100%\
            );`,
    };

    const updateAnonymity = (value: number) => {
        if (value !== targetAnonymity) {
            dispatch(coinjoinAccountUpdateAnonymity(accountKey, value));
            setSliderPosition(getPosition(value));
        }
    };

    const labels = useMemo(
        () => [
            {
                value: 1,
                max: 1,
                component: (
                    <Label>
                        <Icon name="oneUser" size={14} color={theme.legacy.TYPE_DARK_GREY} /> 1
                    </Label>
                ),
            },
            {
                value: 3,
                max: 3,
                component: (
                    <Label>
                        <Icon name="twoUsers" size={14} color={theme.legacy.TYPE_DARK_GREY} /> 3
                    </Label>
                ),
            },
            {
                value: 10,
                max: 10,
                component: (
                    <Label>
                        <Icon name="threeUsers" size={14} color={theme.legacy.TYPE_DARK_GREY} /> 10
                    </Label>
                ),
            },
            {
                value: 30,
                max: 30,
                component: (
                    <Label>
                        <Icon name="fourUsers" size={14} color={theme.legacy.TYPE_DARK_GREY} /> 30
                    </Label>
                ),
            },
            {
                value: 100,
                max: 100,
                component: (
                    <Label>
                        <Icon name="fourUsers" size={14} color={theme.legacy.TYPE_DARK_GREY} /> 100
                    </Label>
                ),
            },
        ],
        [theme],
    );

    return (
        <SetupSlider
            heading={<Translation id="TR_COINJOIN_ANONYMITY_LEVEL_SETUP_TITLE" />}
            description={<Translation id="TR_COINJOIN_ANONYMITY_LEVEL_SETUP_DESCRIPTION" />}
            onChange={updateAnonymity}
            value={targetAnonymity}
            sliderValue={sliderPosition}
            min={1}
            max={100}
            trackStyle={trackStyle}
            labels={labels}
            modifyPosition={getValue}
        >
            <AnimatePresence initial={!isErrorDisplayed}>
                {isErrorDisplayed && (
                    <motion.div {...expandAnimation}>
                        <Banner icon variant="destructive">
                            <Translation
                                values={{
                                    red: chunks => <RedText>{chunks}</RedText>,
                                }}
                                id="TR_LOW_ANONYMITY_WARNING"
                            />
                        </Banner>
                    </motion.div>
                )}
            </AnimatePresence>
        </SetupSlider>
    );
};
