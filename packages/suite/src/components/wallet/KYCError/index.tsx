import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { resolveStaticPath } from '@trezor/utils';
import { SavingsKYCCard } from '@wallet-views/coinmarket';

const StyledCard = styled(SavingsKYCCard)`
    background: rgba(239, 65, 65, 0.1);
    color: ${props => props.theme.BG_RED};
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
    font-size: 14px;
    line-height: 18px;
`;

const KYCError = () => (
    <StyledCard>
        <Icon>
            <img src={resolveStaticPath('images/svg/warning.svg')} alt="" />
        </Icon>
        <Text>
            <Header>
                <Translation id="TR_SAVINGS_SETUP_KYC_ERROR_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_SETUP_KYC_ERROR_DESCRIPTION" />
            </Description>
        </Text>
    </StyledCard>
);
export default KYCError;
