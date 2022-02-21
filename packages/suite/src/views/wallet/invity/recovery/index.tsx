import React, { useContext, useEffect, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { InvityLayout, withSelectedAccountLoaded } from '@wallet-components';
import invityAPI from '@suite-services/invityAPI';
import { InvityLayoutProps } from '@suite/components/wallet/InvityLayout';
import { InvityAuthenticationContext } from '@suite/components/wallet/InvityAuthentication';
import { Translation } from '@suite-components';
import { Loader } from '@trezor/components';
import { useInvityNavigation } from '@suite/hooks/wallet/useInvityNavigation';

const DefaultIframeHeight = 113;

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

const StyledLoader = styled(Loader)<{ isHidden: boolean }>`
    height: ${`${DefaultIframeHeight}px`};
    width: 100%;
    display: ${props => (props.isHidden ? 'none' : 'flex')};
`;

const CoinmarketSavingsRecovery = ({ selectedAccount }: InvityLayoutProps) => {
    const { iframeMessage } = useContext(InvityAuthenticationContext);
    const [iframeHeight, setIframeHeight] = useState<number>();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isFrameLoading, setIsIframeLoading] = useState(true);
    const { navigateToInvityRecoverySent } = useInvityNavigation(selectedAccount.account);
    useEffect(() => {
        if (iframeMessage?.action === 'resize') {
            setIframeHeight(iframeMessage.data);
        }
        if (iframeMessage?.action === 'loaded') {
            setIsIframeLoading(false);
        }
        if (iframeMessage?.action === 'recovery-sent') {
            setIsIframeLoading(true);
            navigateToInvityRecoverySent();
        }
    }, [iframeMessage, navigateToInvityRecoverySent]);

    const theme = useTheme();

    return (
        <InvityLayout selectedAccount={selectedAccount}>
            <Wrapper>
                <Left />
                <Right>
                    <Header>
                        <Translation id="TR_INVITY_RECOVERY_HEADER" />
                    </Header>
                    <Description>
                        <Translation id="TR_INVITY_RECOVERY_DESCRIPTION" />
                    </Description>
                    <StyledLoader isHidden={!isFrameLoading} />
                    <StyledIframe
                        isHidden={isFrameLoading}
                        ref={iframeRef}
                        title="recovery"
                        frameBorder="0"
                        height={`${iframeHeight || DefaultIframeHeight}px`}
                        src={invityAPI.getRecoveryPageSrc(theme.THEME)}
                        sandbox="allow-scripts allow-forms allow-same-origin"
                    />
                </Right>
            </Wrapper>
        </InvityLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketSavingsRecovery, {
    title: 'TR_NAV_INVITY',
    redirectUnauthorizedUserToLogin: false,
});
