import { WalletLayout, CoinmarketFooter } from '@wallet-components';
import { Card } from '@trezor/components';
import { useSelector, useActions } from '@suite-hooks';
import { useBuyInfo } from '@wallet-hooks/useCoinmarket';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import React, { ReactNode, useEffect } from 'react';
import styled from 'styled-components';

import Navigation from './components/Navigation';
import AccountTransactions from './components/AccountTransactions';

const Content = styled.div`
    padding: 25px;
`;

const BottomContent = styled.div``;

interface Props {
    children: ReactNode;
}

const CoinmarketLayout = ({ children }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const savedBuyInfo = useSelector(state => state.wallet.coinmarket.buy.buyInfo);
    const { saveBuyInfo } = useActions({ saveBuyInfo: coinmarketBuyActions.saveBuyInfo });
    const { buyInfo } = useBuyInfo();

    useEffect(() => {
        if (!savedBuyInfo?.buyInfo) {
            saveBuyInfo(buyInfo);
        }
    });

    return (
        <WalletLayout title="Coinmarket" account={selectedAccount}>
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
