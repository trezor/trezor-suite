import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { Card } from './Card';
import { variables } from '../../index';

const Wrapper = styled.div`
    margin: 10px 0;
    background: ${({ theme }) => theme.BG_GREY};
    padding: 20px;
`;

const StyledCard = styled(Card)`
    margin: 20px;
`;

const Text = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

storiesOf('Others', module).add('Card', () => (
    <Wrapper>
        <StyledCard>
            <Text>basic card</Text>
        </StyledCard>
        <StyledCard noPadding>
            <Text>Card with noPadding</Text>
        </StyledCard>
        <StyledCard largePadding>
            <Text>Card with largePadding</Text>
        </StyledCard>
        <StyledCard noVerticalPadding>
            <Text>Card with noVerticalPadding</Text>
        </StyledCard>
    </Wrapper>
));
