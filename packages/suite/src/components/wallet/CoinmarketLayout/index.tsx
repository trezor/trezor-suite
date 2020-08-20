import { WalletLayout, CoinmarketFooter } from '@wallet-components';
import { Card } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

import Navigation from './components/Navigation';
import PreviousTransactions from './components/PreviousTransactions';

const Content = styled.div`
    padding: 25px;
`;

const BottomContent = styled.div``;

interface Props {
    children: ReactNode;
}

const CoinmarketLayout = ({ children }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    return (
        <WalletLayout title="Coinmarket" account={selectedAccount}>
            <Card noPadding>
                <Navigation />
                <Content>{children}</Content>
            </Card>
            <BottomContent>
                <PreviousTransactions />
                <CoinmarketFooter />
            </BottomContent>
        </WalletLayout>
    );
};

export default CoinmarketLayout;
