import React from 'react';
import { ReactSVG } from 'react-svg';
import styled from 'styled-components';
import { Card, Translation } from '@suite-components';
import { resolveStaticPath } from '@suite-utils/build';

const StyledCard = styled(Card)`
    background: rgba(239, 201, 65, 0.1);
    color: #ba9924;
    border-radius: 6px;
    display: flex;
    margin-bottom: 28px;
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
            <ReactSVG src={resolveStaticPath('images/svg/user-focus.svg')} />
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
