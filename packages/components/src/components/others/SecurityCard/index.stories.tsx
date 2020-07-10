import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { SecurityCard } from './index';
import { variables, colors } from '../../../index';

const Wrapper = styled.div`
    margin: 10px 0;
    display: flex;
    flex-wrap: wrap;
    background: ${colors.NEUE_BG_GRAY};
`;

const StyledSecurityCard = styled(SecurityCard)`
    margin: 20px;
`;

storiesOf('Others', module).add('Security Card', () => {
    return (
        <Wrapper>
            <StyledSecurityCard
                description="PIN Set strong PIN number against unauthorized access"
                variant="primary"
                heading="Heading of the card"
                icon="CHECK"
            />
            <StyledSecurityCard
                description="PIN Set strong PIN number against unauthorized access"
                variant="secondary"
                heading="heading"
                icon="CHECK"
            />
            <StyledSecurityCard
                description="PIN Set strong PIN number against unauthorized access"
                variant="secondary"
                heading="heading"
                icon="CHECK"
            />
            <StyledSecurityCard
                description="PIN Set strong PIN number against unauthorized access"
                variant="secondary"
                heading="heading"
                icon="CHECK"
            />
            <StyledSecurityCard
                description="PIN Set strong PIN number against unauthorized access"
                variant="secondary"
                heading="Heading of the card"
                icon="CHECK"
            />
        </Wrapper>
    );
});
