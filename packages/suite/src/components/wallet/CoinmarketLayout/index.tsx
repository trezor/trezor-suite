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

const Footer = styled.div``;

interface Props {
    children: ReactNode;
    footer: ReactNode;
}

const CoinmarketLayout = ({ children, footer }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    return (
        <WalletLayout title="Coinmarket" account={selectedAccount}>
            <Card noPadding>
                <Navigation items={MENU_ITEMS} />
                <Content>{children}</Content>
            </Card>
            {footer && <Footer>{footer}</Footer>}
        </WalletLayout>
    );
};

export default CoinmarketLayout;
