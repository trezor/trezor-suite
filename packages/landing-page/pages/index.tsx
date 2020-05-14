import React from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { H2, Button, P, Link } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Item = styled.div``;

const ButtonAccess = styled(Button)`
    margin: 30px 0 60px 0;
`;

const ButtonBecomeTester = styled(Button)`
    margin: 5px 0 0 0;
`;

const ButtonWallet = styled(Button)`
    margin: 0 0 0 5px;
`;

const HeadBackP = styled(P)`
    display: flex;
    align-items: center;
`;

const Index = () => (
    <Layout>
        <Wrapper>
            <H2>Access Trezor Beta Wallet</H2>
            <P size="tiny">
                Beta Wallet is now behind a login wall. To access Beta Wallet with experimental
                features please sign up to our Beta Testers Community.
            </P>
            <Item>
                <Link
                    href="https://blog.trezor.io/join-the-trezor-beta-testers-community-b19761f4960a"
                    target="_blank"
                    variant="nostyle"
                >
                    <ButtonBecomeTester variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                        Become a tester
                    </ButtonBecomeTester>
                </Link>
            </Item>
            <Item>
                <Link href="/wallet" target="_blank" variant="nostyle">
                    <ButtonAccess variant="primary">Access Beta Wallet</ButtonAccess>
                </Link>
            </Item>
            <HeadBackP size="tiny">
                Otherwise, please head back to our stable and safe Wallet{' '}
                <Link href="https://wallet.trezor.io" target="_blank" variant="nostyle">
                    <ButtonWallet variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                        wallet.trezor.io
                    </ButtonWallet>
                </Link>
            </HeadBackP>
        </Wrapper>
    </Layout>
);

export default Index;
