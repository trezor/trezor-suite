import { WalletLayout, CoinmarketFooter, WalletLayoutHeader } from 'src/components/wallet';
import { Card, Button, variables } from '@trezor/components';
import React, { ReactNode } from 'react';
import styled from 'styled-components';
import Navigation from './components/Navigation';
import AccountTransactions from './components/AccountTransactions';
import { Translation } from 'src/components/suite';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';

const Content = styled.div`
    padding: 29px 41px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 29px 20px;
    }
`;

const BottomContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

interface Props {
    children: ReactNode;
    selectedAccount: SelectedAccountLoaded;
    onClearFormButtonClick?: () => void;
}

const CoinmarketLayout = ({ children, selectedAccount, onClearFormButtonClick }: Props) => (
    <WalletLayout title="TR_NAV_TRADE" account={selectedAccount}>
        <WalletLayoutHeader title="TR_NAV_TRADE">
            {onClearFormButtonClick && (
                <Button type="button" variant="tertiary" onClick={onClearFormButtonClick}>
                    <Translation id="TR_CLEAR_ALL" />
                </Button>
            )}
        </WalletLayoutHeader>

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

export default CoinmarketLayout;
