import React from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { H2, Button, P } from '@trezor/components';

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
            <H2>Access Trezor Suite (beta)</H2>
            <P size="tiny">
                Do you want to test the newest Wallet features? Sign up below and become a beta
                tester. In case you wish to go back to a stable Wallet, please proceed by clicking
                the button.
            </P>
            <Item>
                <ButtonBecomeTester variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                    Become a tester
                </ButtonBecomeTester>
            </Item>
            <Item>
                <ButtonAccess variant="primary">Access Trezor Suite (beta)</ButtonAccess>
            </Item>
            <HeadBackP size="tiny">
                Otherwise head back to stable and super-safe{' '}
                <ButtonWallet variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                    wallet.trezor.io
                </ButtonWallet>
            </HeadBackP>
        </Wrapper>
    </Layout>
);

export default Index;
