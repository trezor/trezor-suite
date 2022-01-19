import {
    WalletLayout,
    CoinmarketFooter,
    WalletLayoutHeader,
    InvityContextDropdown,
} from '@wallet-components';
import { Card, Button, variables } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import React, { ReactNode } from 'react';
import styled from 'styled-components';
import Navigation from './components/Navigation';
import AccountTransactions from './components/AccountTransactions';
import { Translation } from '@suite-components';

const Content = styled.div`
    padding: 29px 41px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 29px 20px;
    }
`;

const BottomContent = styled.div``;

interface Props {
    children: ReactNode;
    onClearFormButtonClick?: () => void;
}

const CoinmarketLayout = ({ children, onClearFormButtonClick }: Props) => {
    // TODO: can we get selectedAccount from top in 100% cases?
    const { selectedAccount } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
    }));
    const showInvityContextDropdown =
        selectedAccount.status === 'loaded' && selectedAccount.account.symbol === 'btc';
    return (
        <WalletLayout title="TR_NAV_TRADE" account={selectedAccount}>
            <WalletLayoutHeader title="TR_NAV_TRADE">
                {onClearFormButtonClick && (
                    <Button type="button" variant="tertiary" onClick={onClearFormButtonClick}>
                        <Translation id="TR_CLEAR_ALL" />
                    </Button>
                )}
                {showInvityContextDropdown && (
                    <InvityContextDropdown selectedAccount={selectedAccount} />
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
};

export default CoinmarketLayout;
