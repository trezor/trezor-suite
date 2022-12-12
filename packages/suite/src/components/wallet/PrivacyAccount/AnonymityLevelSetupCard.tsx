import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Card, Input, P, variables } from '@trezor/components';
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

const SetupCard = styled(Card)`
    position: relative;
    margin-bottom: 20px;
    overflow: hidden;
`;

const Level = styled(Input)`
    position: absolute;
    right: 0;
    width: 68px;
    height: 42px;
    padding: 1px 12px 0 12px;
    border: 1.5px solid ${({ theme }) => theme.STROKE_GREY};
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-size: ${variables.FONT_SIZE.H2};
    text-align: center;

    :disabled {
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
        background: ${({ theme }) => theme.BG_LIGHT_RED};
    }
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

    const [inputValue, setInputValue] = useState<number | ''>(targetAnonymity);
    const [sliderPosition, setSliderPosition] = useState(getPosition(targetAnonymity || 1));

    const dispatch = useDispatch();
    const previousValue = useRef(inputValue);

    useEffect(() => {
        if (targetAnonymity !== inputValue) {
            setInputValue(targetAnonymity);
        }
    }, [targetAnonymity]); // eslint-disable-line react-hooks/exhaustive-deps

    const setAnonymity = useCallback(
        (number: number) => {
            if (Number.isNaN(number)) {
                return;
            }

            previousValue.current = number;
            dispatch(coinjoinAccountUpdateAnonymity(currentAccount?.key ?? '', number));
            setSliderPosition(getPosition(number));
        },
        [currentAccount?.key, dispatch],
    );

    const handleChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        if (target.value === '') {
            setInputValue('');

            return;
        }

        const number = Number(target.value);
        if (Number.isNaN(number)) {
            return;
        }

        previousValue.current = number;
        setInputValue(number);
    };

    const handleFocus = () => {
        setInputValue('');
    };

    const handleBlur = () => {
        let formattedNumber = Number(inputValue);

        if ((!formattedNumber || formattedNumber < 1) && previousValue.current !== '') {
            formattedNumber = previousValue.current;
        }

        if (formattedNumber > 100) {
            formattedNumber = 100;
        }

        setInputValue(formattedNumber);
        setAnonymity(formattedNumber);
    };

    const isSessionActive = !!session;

    return (
        <SetupCard>
            <Level
                noError
                noTopLabel
                value={String(inputValue)}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
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
                setAnonymity={setAnonymity}
            />
        </SetupCard>
    );
};
