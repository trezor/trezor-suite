import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { SecurityCard } from './index';
import { variables, colors } from '../../../index';

const Wrapper = styled.div`
    width: 100%;
    display: grid;
    padding: 20px;
    grid-gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    background: ${colors.NEUE_BG_GRAY};
`;

const StyledSecurityCard = styled(SecurityCard)`
    height: 100%;
`;

storiesOf('Others', module).add('Security Card', () => {
    return (
        <Wrapper>
            <StyledSecurityCard
                variant="primary"
                icon="BACKUP"
                heading="TR_BACKUP_YO UR_DEVICE"
                description="TR_RECOVER Y_SEED_IS_OFFLINE"
                cta={{
                    label: 'TR_BACKUP_NOW',
                    dataTest: 'backup',
                    action: () => {},
                }}
            />
            <StyledSecurityCard
                description="PIN Set strong PIN number against unauthorized access. PIN Set strong PIN number against unauthorized access"
                variant="primary"
                heading="PIN"
                icon="MEDIUM"
                cta={{ label: 'set pin' }}
            />
            <StyledSecurityCard
                variant="secondary"
                heading="PIN code created succesfully!"
                icon="DASHBOARD"
                cta={{ label: 'Some action' }}
            />
            <StyledSecurityCard
                description="PIN Set strong PIN number against unauthorized access"
                variant="primary"
                heading="PIN code created succesfully!"
                icon="EXCHANGE"
                cta={{ label: 'view something' }}
            />
        </Wrapper>
    );
});
