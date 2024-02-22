import { ReactNode } from 'react';
import styled from 'styled-components';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { Card, Button, variables } from '@trezor/components';
import { CoinmarketLayoutNavigation } from './CoinmarketLayoutNavigation';
import { CoinmarketAccountTransactions } from './CoinmarketAccountTransactions/CoinmarketAccountTransactions';
import { Translation } from 'src/components/suite';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';

const Content = styled.div`
    padding: 29px 41px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 29px 20px;
    }
`;

const StyledCard = styled(Card)`
    flex: 1;
    align-self: flex-start;
`;

const BottomContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const Layout = styled.div`
    display: flex;
    flex-direction: row;
    gap: 60px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
    }
`;

interface CoinmarketLayoutProps {
    children: ReactNode;
    selectedAccount: SelectedAccountLoaded;
    onClearFormButtonClick?: () => void;
}

export const CoinmarketLayout = ({
    children,
    selectedAccount,
    onClearFormButtonClick,
}: CoinmarketLayoutProps) => (
    <WalletLayout title="TR_NAV_TRADE" isSubpage account={selectedAccount}>
        <WalletSubpageHeading title="TR_NAV_TRADE">
            {onClearFormButtonClick && (
                <Button
                    size="small"
                    type="button"
                    variant="tertiary"
                    onClick={onClearFormButtonClick}
                >
                    <Translation id="TR_CLEAR_ALL" />
                </Button>
            )}
        </WalletSubpageHeading>

        <Layout>
            <CoinmarketLayoutNavigation />

            <StyledCard paddingType="none">
                <Content>{children}</Content>
            </StyledCard>
        </Layout>

        <BottomContent>
            <CoinmarketAccountTransactions />
            <CoinmarketFooter />
        </BottomContent>
    </WalletLayout>
);
