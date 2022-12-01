import React from 'react';
import styled from 'styled-components';
import { Card, P, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks/useSelector';
import { selectCurrentTargetAnonymity } from '@wallet-reducers/coinjoinReducer';

import { AnonymityLevelSlider } from './AnonymityLevelSlider';

const SetupCard = styled(Card)`
    position: relative;
    margin-bottom: 20px;
    overflow: hidden;
`;

const Level = styled.div`
    position: absolute;
    right: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 64px;
    height: 42px;
    border: 1.5px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 8px;
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-size: ${variables.FONT_SIZE.H2};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Text = styled.div`
    margin-right: 72px;
    margin-bottom: 38px;
`;

export const AnonymityLevelSetupCard = () => {
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity) || 1;

    return (
        <SetupCard>
            <Level>
                <span>{targetAnonymity}</span>
            </Level>

            <Text>
                <P weight="medium">
                    <Translation id="TR_COINJOIN_ANONYMITY_LEVEL_SETUP_TITLE" />
                </P>
                <P size="tiny" weight="medium">
                    <Translation id="TR_COINJOIN_ANONYMITY_LEVEL_SETUP_DESCRIPTION" />
                </P>
            </Text>

            <AnonymityLevelSlider />
        </SetupCard>
    );
};
