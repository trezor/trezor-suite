import { ReactNode } from 'react';
import styled from 'styled-components';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { Card, Button, variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import CoinmarketLayoutNavigation from 'src/views/wallet/coinmarket/common/CoinmarketLayoutNew/CoinmarketLayoutNavigation/CoinmarketLayoutNavigation';
import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';

const Content = styled.div`
    padding: 29px 41px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 29px 20px;
    }
`;

const CoinmarketWrapper = styled.div`
    padding: 0 ${spacingsPx.lg};

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        padding: 0;
    }
`;

const CardWrapper = styled.div`
    flex: 1;
    align-self: flex-start;
`;

const BottomContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-top: ${spacingsPx.xxxl};
`;

const Layout = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: ${spacingsPx.xl};

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
        <CoinmarketWrapper>
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

            <CoinmarketLayoutNavigation selectedAccount={selectedAccount} />

            <Layout>
                <CardWrapper>
                    <Card paddingType="none">
                        <Content>{children}</Content>
                    </Card>
                </CardWrapper>
            </Layout>

            <BottomContent>
                <CoinmarketFooter />
            </BottomContent>
        </CoinmarketWrapper>
    </WalletLayout>
);
