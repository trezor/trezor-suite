import React from 'react';
import styled, { useTheme } from 'styled-components';
import { H3, Icon, variables } from '@trezor/components';
import { Card, Translation } from 'src/components/suite';
import { AccountLoadingProgress } from './AccountLoadingProgress';
import { RotatingFacts } from './RotatingFacts';

const Container = styled(Card)`
    flex-direction: column;
    align-items: center;
    padding-top: 36px;
    padding-bottom: 36px;
    margin-bottom: 24px;
`;

const FactHeading = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_ORANGE};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
`;

const SparksIcon = styled(Icon)`
    margin-right: 4px;
    padding-bottom: 2px;
`;

export const CoinjoinAccountDiscoveryProgress = () => {
    const theme = useTheme();

    return (
        <Container>
            <H3>
                <Translation id="TR_LOADING_FUNDS" />
            </H3>

            <AccountLoadingProgress />

            <FactHeading>
                <SparksIcon icon="EXPERIMENTAL" size={13} color={theme.TYPE_ORANGE} />
                <Translation id="TR_LOADING_FACT_TITLE" />
            </FactHeading>

            <RotatingFacts />
        </Container>
    );
};
