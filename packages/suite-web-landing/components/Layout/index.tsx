import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { TrezorLogo, Button, colors, variables, Link } from '@trezor/components';

const Layout = styled.div`
    max-width: ${variables.SCREEN_SIZE.XL};
    width: 100%;
    margin: 0 auto;
    padding: 0 20px;
    background: ${colors.NEUE_BG_WHITE};
`;

const Header = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 28px 0 0 0;
`;

const StyledTrezorLogo = styled(TrezorLogo)`
    min-height: 46px;
`;

const Content = styled.div`
    margin: 88px 0 0 0;
`;

const Footer = styled.footer`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e8e8e8;
    padding: 60px 20px 100px 20px;
    text-align: center;

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: row;
        align-items: flex-start;
        padding: 60px 53px 100px 125px;
        text-align: left;
    }
`;

const FooterList = styled.div`
    & + & {
        margin-top: 40px;
    }
    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        & + & {
            margin-top: 0px;
            margin-left: 107px;
        }
    }
`;

const FooterLinks = styled.div`
    display: flex;
    flex-direction: column;

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: row;
    }
`;

const FooterHeadline = styled.h3`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: bold;
    margin-bottom: 15px;
`;

const FooterLink = styled(Link)`
    && {
        display: block;
        font-size: ${variables.FONT_SIZE.TINY};
        & + & {
            margin-top: 11px;
        }
    }
`;

const FooterCompany = styled.div`
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;
    margin-top: 40px;

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        text-align: right;
        align-items: flex-end;
        margin-top: 0;
    }
`;

const FooterParagraph = styled.p`
    font-size: ${variables.FONT_SIZE.TINY};
    margin-top: 17px;
    & a {
        text-decoration: underline;
    }
`;

interface Props {
    children: ReactNode;
}

const Index = ({ children }: Props) => (
    <Layout>
        <Header>
            <StyledTrezorLogo type="suite" width={185} />
            <Button
                variant="tertiary"
                icon="EXTERNAL_LINK"
                alignIcon="right"
                color={colors.NEUE_TYPE_DARK_GREY}
            >
                <Link variant="nostyle" href="./web">
                    Trezor Suite for web
                </Link>
            </Button>
        </Header>
        <Content>{children}</Content>
        <Footer>
            <FooterLinks>
                <FooterList>
                    <FooterHeadline>Improve</FooterHeadline>
                    <FooterLink href="https://satoshilabs.typeform.com/to/Dqb71wm1">
                        Give feedback
                    </FooterLink>
                    <FooterLink href="https://blog.trezor.io/join-the-trezor-beta-testers-community-b19761f4960a">
                        Join closed Beta
                    </FooterLink>
                </FooterList>
                <FooterList>
                    <FooterHeadline>Follow</FooterHeadline>
                    <FooterLink href="https://blog.trezor.io/">Trezor Blog</FooterLink>
                </FooterList>
            </FooterLinks>
            <FooterCompany>
                <TrezorLogo type="horizontal" variant="black" width="83px" />
                <FooterParagraph>
                    The companion of the <Link href="https://trezor.io/">Trezor HW wallet</Link>
                </FooterParagraph>
            </FooterCompany>
        </Footer>
    </Layout>
);

export default Index;
