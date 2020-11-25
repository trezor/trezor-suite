import { WalletLayout, CoinmarketFooter } from '@wallet-components';
import { Card } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import React, { ReactNode } from 'react';
import styled from 'styled-components';
import Navigation from './components/Navigation';
import AccountTransactions from './components/AccountTransactions';

const Content = styled.div`
    padding: 29px 41px;
`;

const BottomContent = styled.div``;

interface Props {
    children: ReactNode;
}

const CoinmarketLayout = ({ children }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    return (
        <WalletLayout title="TR_NAV_TRADE" account={selectedAccount} showEmptyHeaderPlaceholder>
            <Card noPadding>
                <Navigation />
                <Content>{children}</Content>
            </Card>
            <BottomContent>
                <AccountTransactions />
                <CoinmarketFooter />
            </BottomContent>
        </WalletLayout>
    );
};

export default CoinmarketLayout;
