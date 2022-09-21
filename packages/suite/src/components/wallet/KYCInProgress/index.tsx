import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { SavingsKYCCard } from '@wallet-views/coinmarket';
import { Image } from '@trezor/components';

const StyledCard = styled(SavingsKYCCard)`
    background: rgba(239, 201, 65, 0.1);
    color: #ba9924;
`;

const Icon = styled.div`
    margin-right: 17px;
`;
const Text = styled.div``;
const Header = styled.div`
    font-size: 16px;
    line-height: 28px;
`;
const Description = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: 14px;
    line-height: 18px;
`;

const KYCInProgress = () => (
    <StyledCard>
        <Icon>
            <Image image="USER_FOCUS" />
        </Icon>
        <Text>
            <Header>
                <Translation id="TR_SAVINGS_SETUP_KYC_IN_PROGRESS_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_SETUP_KYC_IN_PROGRESS_DESCRIPTION" />
            </Description>
        </Text>
    </StyledCard>
);
export default KYCInProgress;
