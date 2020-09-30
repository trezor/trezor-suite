import React from 'react';
import styled from 'styled-components';
import Layout from '@suite-web-landing-components/Layout';
import { H2, Button, P, Link, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const Item = styled.div``;

const ButtonAccess = styled(Button)`
    margin: 0 0 10px 0;
`;

const StyledP = styled(P)`
    margin: 10px 0;
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const ButtonWallet = styled(Button)`
    margin: 10px 0;
`;

const HeadBackP = styled(P)`
    display: flex;
    margin-top: 10px;
    font-size: ${variables.FONT_SIZE.NORMAL};
    flex-direction: column;
`;

const InfoRow = styled.div`
    display: flex;
    margin: 0 0 20px 0;
    flex-direction: column;
`;

const Line = styled.div`
    margin: 50px 0;
    border-top: 2px solid #ececec;
`;

const Index = () => (
    <Layout>
        <Wrapper>
            <H2>Beta Wallet</H2>
            <StyledP size="tiny">
                Beta Wallet is now specially designated for experimental testing and the access is
                limited exclusively to our Beta Testers Community.
            </StyledP>
            <Item>
                <Link
                    href={
                        process.env.assetPrefix
                            ? `${process.env.assetPrefix}/wallet/start`
                            : '/wallet/start'
                    }
                    target="_self"
                    variant="nostyle"
                >
                    <ButtonAccess variant="primary">Log in to Beta Wallet</ButtonAccess>
                </Link>
            </Item>
            <Line />
            <H2>Stable Wallet &amp; ETH / XRP Wallet</H2>
            <HeadBackP size="tiny">
                <InfoRow>
                    For ETH, XRP, ETC and ERC-20 tokens go to Trezor ETH / XRP Wallet:
                    <Link
                        href="https://beta-wallet.trezor.io/next"
                        target="_blank"
                        variant="nostyle"
                    >
                        <ButtonWallet variant="secondary">Trezor ETH / XRP Wallet</ButtonWallet>
                    </Link>
                </InfoRow>
                <InfoRow>
                    For BTC &amp; other coins go to Trezor Stable Wallet:
                    <Link href="https://wallet.trezor.io" target="_blank" variant="nostyle">
                        <ButtonWallet variant="secondary">Trezor Wallet</ButtonWallet>
                    </Link>
                </InfoRow>
            </HeadBackP>
        </Wrapper>
    </Layout>
);

export default Index;
