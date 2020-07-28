import { WalletLayout } from '@wallet-components';
import { Card } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { MENU_ITEMS } from '@wallet-config/coinmarket';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

import Navigation from './components/Navigation';

const Content = styled.div`
    padding: 25px;
`;

const BottomContent = styled.div``;

interface Props {
    children: ReactNode;
    bottom?: ReactNode;
}

const CoinmarketLayout = ({ children, bottom }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    return (
        <WalletLayout title="Coinmarket" account={selectedAccount}>
            <Card noPadding>
                <Navigation items={MENU_ITEMS} />
                <Content>{children}</Content>
            </Card>
            {bottom && <BottomContent>{bottom}</BottomContent>}
        </WalletLayout>
    );
};

export default CoinmarketLayout;
