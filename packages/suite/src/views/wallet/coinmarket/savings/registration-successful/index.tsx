import React from 'react';
import { withCoinmarketLoaded } from '@wallet-components';
import { resolveStaticPath } from '@suite-utils/build';
import styled from 'styled-components';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const SpecularImg = styled.img`
    margin: 64px 0;
    align-self: center;
`;

const Header = styled.div`
    font-size: 24px;
    align-self: center;
`;

const Description = styled.div`
    align-self: center;
`;

const CoinmarketSavingsRegistrationSuccessful = () => (
    <Wrapper>
        <SpecularImg
            src={resolveStaticPath('images/suite/3d/specular.png')}
            width="77.42"
            height="61.21"
            alt=""
        />
        <Header>
            <Translation id="TR_SAVINGS_REGISTRATION_SUCCESSFUL_HEADER" />
        </Header>
        <Description>
            <Translation id="TR_SAVINGS_REGISTRATION_SUCCESSFUL_DESCRIPTION" />
        </Description>
    </Wrapper>
);

export default withCoinmarketLoaded(CoinmarketSavingsRegistrationSuccessful, 'TR_NAV_SAVINGS');
