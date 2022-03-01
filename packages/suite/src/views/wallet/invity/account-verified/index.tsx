import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { resolveStaticPath } from '@suite-utils/build';
import { withInvityLayout, WithInvityLayoutProps } from '@wallet-components';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import { Button } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: center;
`;

const SpecularImg = styled.img`
    margin: 64px 0;
`;

const Header = styled.div`
    font-size: 24px;
    margin-bottom: 12px;
`;

const Description = styled.div`
    font-size: 14px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 12px;
`;

const AccountVerified = ({ selectedAccount }: WithInvityLayoutProps) => {
    const { navigateToInvityLogin } = useInvityNavigation(selectedAccount.account);
    return (
        <Wrapper>
            <SpecularImg src={resolveStaticPath('images/suite/3d/folder.png')} alt="" />
            <Header>
                <Translation id="TR_SAVINGS_ACCOUNT_VERIFIED_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_ACCOUNT_VERIFIED_DESCRIPTION" />
            </Description>
            <Button onClick={() => navigateToInvityLogin()}>
                <Translation id="TR_SAVINGS_ACCOUNT_VERIFIED_BUTTON_LABEL" />
            </Button>
        </Wrapper>
    );
};

export default withInvityLayout(AccountVerified, {
    redirectUnauthorizedUserToLogin: false,
    showStepsGuide: false,
});
