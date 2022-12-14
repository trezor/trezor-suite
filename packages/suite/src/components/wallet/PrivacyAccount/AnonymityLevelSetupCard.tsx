import React, { useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { Card, P } from '@trezor/components';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks/useSelector';
import {
    selectCurrentCoinjoinSession,
    selectCurrentTargetAnonymity,
} from '@wallet-reducers/coinjoinReducer';

import { AnonymityLevelSlider, getPosition } from './AnonymityLevelSlider';
import { useDispatch } from 'react-redux';
import { selectSelectedAccount } from '@wallet-reducers/selectedAccountReducer';
import { coinjoinAccountUpdateAnonymity } from '@wallet-actions/coinjoinAccountActions';
import { SliderInput } from './SliderInput';

const SetupCard = styled(Card)`
    position: relative;
    margin-bottom: 20px;
    overflow: hidden;
`;

const Description = styled(P)`
    margin-top: 6px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Text = styled.div`
    margin-right: 72px;
    margin-bottom: 14px;
`;

export const AnonymityLevelSetupCard = () => {
    const currentAccount = useSelector(selectSelectedAccount);
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity) || 1;
    const session = useSelector(selectCurrentCoinjoinSession);

    const [sliderPosition, setSliderPosition] = useState(getPosition(targetAnonymity));

    const inputRef = useRef<{ setPreviousValue: (number: number) => void }>(null);
    const dispatch = useDispatch();

    const setAnonymity = useCallback(
        (number: number) => {
            if (Number.isNaN(number)) {
                return;
            }

            dispatch(coinjoinAccountUpdateAnonymity(currentAccount?.key ?? '', number));
            setSliderPosition(getPosition(number));
        },
        [currentAccount?.key, dispatch],
    );

    const handleSliderChange = useCallback(
        (number: number) => {
            inputRef.current?.setPreviousValue(number);
            setAnonymity(number);
        },
        [setAnonymity],
    );

    const isSessionActive = !!session;

    return (
        <SetupCard>
            <SliderInput
                ref={inputRef}
                value={targetAnonymity}
                onChange={setAnonymity}
                isDisabled={isSessionActive}
            />

            <Text>
                <P weight="medium">
                    <Translation id="TR_COINJOIN_ANONYMITY_LEVEL_SETUP_TITLE" />
                </P>
                <Description size="small" weight="medium">
                    <Translation id="TR_COINJOIN_ANONYMITY_LEVEL_SETUP_DESCRIPTION" />
                </Description>
            </Text>

            <AnonymityLevelSlider
                isSessionActive={isSessionActive}
                position={sliderPosition}
                handleChange={handleSliderChange}
            />
        </SetupCard>
    );
};
