import React from 'react';
import { resolveStaticPath } from '@suite-utils/build';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { withInvityLayout } from '@wallet-components';

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
    margin-bottom: 12px;
`;

const Description = styled.div`
    align-self: center;
`;

const RegistrationSuccessful = () => (
    <Wrapper>
        <SpecularImg src={resolveStaticPath('images/suite/3d/folder.png')} alt="" />
        <Header>
            <Translation id="TR_SAVINGS_REGISTRATION_SUCCESSFUL_HEADER" />
        </Header>
        <Description>
            <Translation id="TR_SAVINGS_REGISTRATION_SUCCESSFUL_DESCRIPTION" />
        </Description>
    </Wrapper>
);

export default withInvityLayout(RegistrationSuccessful, {
    redirectUnauthorizedUserToLogin: false,
    showStepsGuide: true,
});
