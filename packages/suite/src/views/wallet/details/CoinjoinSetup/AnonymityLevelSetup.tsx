import { useMemo, useState } from 'react';

import { AnimatePresence, type MotionProps, motion } from 'framer-motion';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Banner, Icon, motionEasing } from '@trezor/components';

import { coinjoinAccountUpdateAnonymity } from 'src/actions/wallet/coinjoinAccountActions';
import { AnonymityStatus } from 'src/constants/suite/coinjoin';
import { useAnonymityStatus, useDispatch } from 'src/hooks/suite';

import { SetupSlider } from './SetupSlider/SetupSlider';
import {
    GRADIENT_SLIDER_GREEN_END,
    GRADIENT_SLIDER_GREEN_START,
    GRADIENT_SLIDER_RED_END,
    GRADIENT_SLIDER_YELLOW_END,
    GRADIENT_SLIDER_YELLOW_START,
} from './consts';

const Label = styled.span`
    display: flex;
    align-items: center;
    gap: 2px;
    height: 14px;
`;

const RedText = styled.span`
    margin-right: 2px;
    color: ${({ theme }) => theme.contentCritical};
`;

const expandAnimation: Partial<MotionProps> = {
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

    const isErrorDisplayed = anonymityStatus === AnonymityStatus.Bad;

    const trackStyle = {
        background: `\
            linear-gradient(270deg,\
                ${GRADIENT_SLIDER_GREEN_START} 0%,\
                ${GRADIENT_SLIDER_GREEN_END} 60%,\
                ${GRADIENT_SLIDER_YELLOW_START} 70%,\
                ${GRADIENT_SLIDER_YELLOW_END} 85%,\
                ${GRADIENT_SLIDER_RED_END} 100%\
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
                        <Icon name="user" size={14} intent="neutral" /> 1
                    </Label>
                ),
            },
            {
                value: 3,
                max: 3,
                component: (
                    <Label>
                        <Icon name="users" size={14} intent="neutral" /> 3
                    </Label>
                ),
            },
            {
                value: 10,
                max: 10,
                component: (
                    <Label>
                        <Icon name="usersThree" size={14} intent="neutral" /> 10
                    </Label>
                ),
            },
            {
                value: 30,
                max: 30,
                component: (
                    <Label>
                        <Icon name="usersFour" size={14} intent="neutral" /> 30
                    </Label>
                ),
            },
            {
                value: 100,
                max: 100,
                component: (
                    <Label>
                        <Icon name="usersFour" size={14} intent="neutral" /> 100
                    </Label>
                ),
            },
        ],
        [],
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
                        <Banner
                            icon
                            intent="critical"
                            description={
                                <Translation
                                    values={{
                                        red: chunks => <RedText>{chunks}</RedText>,
                                    }}
                                    id="TR_LOW_ANONYMITY_WARNING"
                                />
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </SetupSlider>
    );
};
