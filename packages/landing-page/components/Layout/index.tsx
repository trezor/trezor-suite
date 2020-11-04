import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { TrezorLogo, colors, variables } from '@trezor/components';

const Layout = styled.div`
    display: flex;
    flex: 1;
`;

const Left = styled.div`
    min-width: 384px;
    object-fit: cover;
    background: url(${resolveStaticPath('images/landing/hero.svg')});
    background-repeat: no-repeat;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const Right = styled.div`
    display: flex;
    background: ${colors.BG_WHITE};
    box-shadow: 0 6px 30px 0 rgba(0, 0, 0, 0.15);
    flex-direction: column;
    justify-content: flex-start;
    flex: 1;
    padding: 100px 30px 0 120px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 100px 30px 0 60px;
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        padding: 100px 30px 0 30px;
    }
`;

// const Footer = styled(P)`
//     margin: 0 0 20px 0;
// `;

const Content = styled.div`
    margin: 70px 0 0 0;
    flex: 1;
    max-width: 640px;
`;

const StyledTrezorLogo = styled(TrezorLogo)`
    min-height: 46px;
`;

interface Props {
    children: ReactNode;
}

const Index = ({ children }: Props) => (
    <Layout>
        <Left />
        <Right>
            <StyledTrezorLogo type="suite" width={200} />
            <Content>{children}</Content>
            {/* <Footer size="tiny">We use cookies for functionality and analytics purposes.</Footer> */}
        </Right>
    </Layout>
);

export default Index;
