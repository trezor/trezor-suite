import React from 'react';
import styled, { useTheme } from 'styled-components';
import { InvityLayout, withSelectedAccountLoaded } from '@wallet-components';
import invityAPI from '@suite-services/invityAPI';
import type { InvityLayoutProps } from '@wallet-components/InvityLayout';
import { Translation } from '@suite-components';
import { Loader, Link, LinkProps } from '@trezor/components';
import { isDesktop } from '@suite-utils/env';
import { getRoute } from '@suite-utils/router';
import { SUITE_URL } from '@suite-constants/urls';
import { useInvityLogin } from '@wallet-hooks/useInvityLogin';

const DefaultIframeHeight = 188;

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
`;

const Left = styled.div`
    width: 221px;
`;

const Right = styled.div`
    width: calc(100% - 221px);
`;

const Header = styled.div`
    font-size: 24px;
    line-height: 24px;
    margin-bottom: 8px;
`;

const Description = styled.div`
    font-size: 14px;
    line-height: 24px;
    margin-bottom: 8px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledIframe = styled.iframe<{ isHidden: boolean }>`
    width: 100%;
    margin: 0;
    padding: 0;
    display: ${props => (props.isHidden ? 'none' : 'block')};
`;

const Divider = styled.div`
    margin-top: 25px;
    margin-bottom: 15px;
    height: 1px;
    width: 100%;
    border: 1px solid ${props => props.theme.BG_SECONDARY};
`;

const Footer = styled.div`
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    align-content: stretch;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const ForgotPasswordLink = styled(Link)`
    font-size: 14px;
    line-height: 24px;
    text-decoration: underline;
`;

const NoAccount = styled.span`
    font-size: 14px;
    line-height: 24px;
`;

const CreateAnAccount = styled(Link)`
    font-size: 14px;
    line-height: 24px;
    text-decoration: underline;
`;

const StyledLoader = styled(Loader)<{ isHidden: boolean }>`
    height: ${`${DefaultIframeHeight}px`};
    width: 100%;
    display: ${props => (props.isHidden ? 'none' : 'flex')};
`;

const CoinmarketSavingsLogin = (props: InvityLayoutProps) => {
    const { handleCreateAnAccountClick, handleForgotPasswordClick, iframeHeight, isFrameLoading } =
        useInvityLogin(props);
    // NOTE: For Suite Desktop it's necessary to navigate user to Suite Web, so the user can recover password there.
    // The known reason so far is that the authorization server configuration differs for Suite Desktop and Suite Web.
    // TODO: Figure out how to resolve the recovery process flow issue in Suite Desktop.
    const forgotPasswordLinkProps: LinkProps = {
        href: isDesktop()
            ? `${SUITE_URL}/web${getRoute('wallet-invity-recovery', {
                  symbol: props.selectedAccount.account.symbol,
                  accountIndex: props.selectedAccount.account.index,
                  accountType: props.selectedAccount.account.accountType,
              })}`
            : undefined,
        onClick: !isDesktop() ? handleForgotPasswordClick : undefined,
        variant: 'nostyle',
    };
    const theme = useTheme();
    return (
        <InvityLayout selectedAccount={props.selectedAccount}>
            <Wrapper>
                <Left />
                <Right>
                    <Header>
                        <Translation id="TR_INVITY_LOGIN_HEADER" />
                    </Header>
                    <Description>
                        <Translation id="TR_INVITY_LOGIN_DESCRIPTION" />
                    </Description>
                    <StyledLoader isHidden={!isFrameLoading} />
                    <StyledIframe
                        isHidden={isFrameLoading}
                        title="login"
                        frameBorder="0"
                        height={`${iframeHeight || DefaultIframeHeight}px`}
                        src={invityAPI.getLoginPageSrc(theme.THEME)}
                        sandbox="allow-scripts allow-forms allow-same-origin"
                    />
                    <Divider />
                    <Footer>
                        <ForgotPasswordLink {...forgotPasswordLinkProps}>
                            <Translation id="TR_INVITY_LOGIN_FORGOT_PASSWORD" />
                        </ForgotPasswordLink>
                        <NoAccount>
                            <Translation
                                id="TR_INVITY_LOGIN_NO_ACCOUNT"
                                values={{
                                    createAnAccount: (
                                        <CreateAnAccount
                                            variant="nostyle"
                                            onClick={handleCreateAnAccountClick}
                                        >
                                            <Translation id="TR_INVITY_LOGIN_NO_ACCOUNT_CREATE_AN_ACCOUNT" />
                                        </CreateAnAccount>
                                    ),
                                }}
                            />
                        </NoAccount>
                    </Footer>
                </Right>
            </Wrapper>
        </InvityLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketSavingsLogin, {
    title: 'TR_NAV_INVITY',
    redirectUnauthorizedUserToLogin: false,
});
