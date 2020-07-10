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
                variant="disabled"
                heading="PIN code created succesfully!"
                icon="WALLET"
                cta={{ label: 'Set PIN', isPrimary: true }}
            />
            <StyledSecurityCard
                description="PIN Set strong PIN number against unauthorized access"
                variant="primary"
                heading="PIN code created succesfully!"
                icon="MEDIUM"
                cta={{ label: 'view something', isPrimary: false }}
            />
            <StyledSecurityCard
                description="PIN Set strong PIN number against unauthorized access"
                variant="secondary"
                heading="PIN code created succesfully!"
                icon="DASHBOARD"
                cta={{ label: 'Some action', isPrimary: true }}
            />
            <StyledSecurityCard
                description="PIN Set strong PIN number against unauthorized access"
                variant="primary"
                heading="PIN code created succesfully!"
                icon="EXCHANGE"
                cta={{ label: 'view something', isPrimary: false }}
            />
        </Wrapper>
    );
});
