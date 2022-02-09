import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { InvityLayout, withSelectedAccountLoaded } from '@wallet-components';
import invityAPI from '@suite-services/invityAPI';
import { InvityLayoutProps } from '@suite/components/wallet/InvityLayout';
import { InvityAuthenticationContext } from '@suite/components/wallet/InvityAuthentication';
import { Translation } from '@suite-components';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import { Loader } from '@trezor/components';

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
`;

const ForgotPassword = styled.span`
    font-size: 14px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    text-decoration: underline;
    cursor: not-allowed;
`;

const NoAccount = styled.span`
    font-size: 14px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const CreateAnAccount = styled(NoAccount)`
    text-decoration: underline;
    cursor: pointer;
`;

const StyledLoader = styled(Loader)<{ isHidden: boolean }>`
    height: ${`${DefaultIframeHeight}px`};
    width: 100%;
    display: ${props => (props.isHidden ? 'none' : 'flex')};
`;

const CoinmarketSavingsLogin = ({ selectedAccount }: InvityLayoutProps) => {
    const { iframeMessage } = useContext(InvityAuthenticationContext);
    const { navigateToInvityRegistration } = useInvityNavigation(selectedAccount.account);
    const [iframeHeight, setIframeHeight] = useState<number>();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isFrameLoading, setIsIframeLoading] = useState(true);

    useEffect(() => {
        if (iframeMessage?.action === 'resize') {
            setIframeHeight(iframeMessage.data);
        }
        if (iframeMessage?.action === 'loaded') {
            setIsIframeLoading(false);
        }
        if (iframeMessage?.action === 'login-successful') {
            setIsIframeLoading(true);
        }
    }, [iframeMessage]);

    const handleCreateAnAccountClick = useCallback(
        () => navigateToInvityRegistration(),
        [navigateToInvityRegistration],
    );
    const theme = useTheme();

    return (
        <InvityLayout selectedAccount={selectedAccount}>
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
                        ref={iframeRef}
                        title="login"
                        frameBorder="0"
                        height={`${iframeHeight || DefaultIframeHeight}px`}
                        src={invityAPI.getLoginPageSrc(theme.THEME)}
                        sandbox="allow-scripts allow-forms allow-same-origin"
                    />
                    <Divider />
                    <Footer>
                        <ForgotPassword>
                            TBD: <Translation id="TR_INVITY_LOGIN_FORGOT_PASSWORD" />
                        </ForgotPassword>
                        <NoAccount>
                            <Translation
                                id="TR_INVITY_LOGIN_NO_ACCOUNT"
                                values={{
                                    createAnAccount: (
                                        <CreateAnAccount onClick={handleCreateAnAccountClick}>
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
