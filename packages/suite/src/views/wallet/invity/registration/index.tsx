import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { WithInvityLayoutProps, InvityLayout, withSelectedAccountLoaded } from '@wallet-components';
import invityAPI from '@suite-services/invityAPI';
import { getRoute } from '@suite-utils/router';
import { Translation } from '@suite-components';
import { InvityAuthenticationContext } from '@wallet-components/InvityAuthentication';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import { Loader } from '@trezor/components';

const DefaultIframeHeight = 232;

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
`;

const Right = styled.div`
    width: 100%;
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

const AlreadyHaveAccount = styled.span`
    font-size: 14px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const LogIn = styled(AlreadyHaveAccount)`
    text-decoration: underline;
    cursor: pointer;
`;

const StyledLoader = styled(Loader)<{ isHidden: boolean }>`
    height: ${`${DefaultIframeHeight}px`};
    width: 100%;
    display: ${props => (props.isHidden ? 'none' : 'flex')};
`;

type CoinmarketSavingsLoginRgistrationProps = WithInvityLayoutProps;

const CoinmarketSavingsRegistration = ({
    selectedAccount,
}: CoinmarketSavingsLoginRgistrationProps) => {
    const { iframeMessage } = useContext(InvityAuthenticationContext);
    const { navigateToInvityLogin } = useInvityNavigation(selectedAccount.account);
    const [iframeHeight, setIframeHeight] = useState<number>();
    const [isFrameLoading, setIsIframeLoading] = useState(true);

    useEffect(() => {
        if (iframeMessage?.action === 'resize') {
            setIframeHeight(iframeMessage.data);
        }
        if (iframeMessage?.action === 'loaded') {
            setIsIframeLoading(false);
        }
    }, [iframeMessage]);

    const handleLogInClick = useCallback(() => navigateToInvityLogin(), [navigateToInvityLogin]);
    const afterVerificationReturnToPath = getRoute('wallet-invity-account-verified', {
        symbol: selectedAccount.account.symbol,
        accountIndex: selectedAccount.account.index,
        accountType: selectedAccount.account.accountType,
    });
    const theme = useTheme();

    return (
        <InvityLayout selectedAccount={selectedAccount} showStepsGuide>
            <Wrapper>
                <Right>
                    <Header>
                        <Translation id="TR_INVITY_REGISTRATION_HEADER" />
                    </Header>
                    <Description>
                        <Translation id="TR_INVITY_REGISTRATION_DESCRIPTION" />
                    </Description>
                    <StyledLoader isHidden={!isFrameLoading} />
                    <StyledIframe
                        isHidden={isFrameLoading}
                        title="registration"
                        frameBorder="0"
                        height={`${iframeHeight || DefaultIframeHeight}px`}
                        src={invityAPI.getRegistrationPageSrc(
                            afterVerificationReturnToPath,
                            theme.THEME,
                        )}
                        sandbox="allow-scripts allow-forms allow-same-origin"
                    />
                    <Divider />
                    <Footer>
                        <AlreadyHaveAccount>
                            <Translation
                                id="TR_INVITY_REGISTRATION_FOOTER_ALREADY_HAVE_AN_ACCOUNT"
                                values={{
                                    login: (
                                        <LogIn onClick={handleLogInClick}>
                                            <Translation id="TR_INVITY_REGISTRATION_FOOTER_ALREADY_HAVE_AN_ACCOUNT_LOGIN" />
                                        </LogIn>
                                    ),
                                }}
                            />
                        </AlreadyHaveAccount>
                    </Footer>
                </Right>
            </Wrapper>
        </InvityLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketSavingsRegistration, {
    title: 'TR_NAV_INVITY',
});
