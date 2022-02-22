import React, { useContext, useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { Translation } from '@suite-components';
import { resolveStaticPath } from '@suite-utils/build';
import { InvityAuthenticationContext } from '@wallet-components/InvityAuthentication';
import invityAPI from '@suite-services/invityAPI';
import { withInvityLayout } from '@wallet-components';

const DefaultIframeHeight = 36;

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
    font-size: 14px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledIframe = styled.iframe<{ isHidden: boolean }>`
    width: 100%;
    margin: 0;
    padding: 0;
    display: ${props => (props.isHidden ? 'none' : 'block')};
`;

const RegistrationSuccessful = () => {
    const { iframeMessage } = useContext(InvityAuthenticationContext);
    const [iframeHeight, setIframeHeight] = useState<number>();

    useEffect(() => {
        if (iframeMessage?.action === 'resize') {
            setIframeHeight(iframeMessage.data);
        }
    }, [iframeMessage]);

    const theme = useTheme();

    return (
        <Wrapper>
            <SpecularImg src={resolveStaticPath('images/suite/3d/folder.png')} alt="" />
            <Header>
                <Translation id="TR_SAVINGS_REGISTRATION_SUCCESSFUL_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_REGISTRATION_SUCCESSFUL_DESCRIPTION" />
            </Description>
            <StyledIframe
                isHidden={false}
                title="verification"
                height={`${iframeHeight || DefaultIframeHeight}px`}
                frameBorder="0"
                src={invityAPI.getVerificationPageSrc(theme.THEME)}
                sandbox="allow-scripts allow-forms allow-same-origin"
            />
        </Wrapper>
    );
};

export default withInvityLayout(RegistrationSuccessful, {
    redirectUnauthorizedUserToLogin: false,
    showStepsGuide: false,
});
