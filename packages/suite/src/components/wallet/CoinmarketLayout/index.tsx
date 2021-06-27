import { WalletLayout, CoinmarketFooter } from '@wallet-components';
import { variables, Card } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import React, { ReactNode } from 'react';
import styled from 'styled-components';
import Navigation from './components/Navigation';
import AccountTransactions from './components/AccountTransactions';
import { Translation, AccountFormCloseButton } from '@suite-components';

const Content = styled.div`
    padding: 29px 41px;
`;

const StyledTitle = styled.h2`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const LayoutNavWrap = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    margin-bottom: 32px;
`;

const BottomContent = styled.div``;

interface Props {
    children: ReactNode;
}

const CoinmarketLayout = ({ children }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    return (
        <WalletLayout title="TR_NAV_TRADE" account={selectedAccount}>
            <LayoutNavWrap>
                <StyledTitle>
                    <Translation id="TR_NAV_TRADE" />
                </StyledTitle>
                <AccountFormCloseButton />
            </LayoutNavWrap>
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
