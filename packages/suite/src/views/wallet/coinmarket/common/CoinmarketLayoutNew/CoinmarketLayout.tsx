import { ReactNode } from 'react';
import styled from 'styled-components';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { Card } from '@trezor/components';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { spacingsPx } from '@trezor/theme';
import CoinmarketLayoutNavigation from './CoinmarketLayoutNavigation/CoinmarketLayoutNavigation';

const CardWrapper = styled(Card)`
    padding: ${spacingsPx.lg} ${spacingsPx.lg} ${spacingsPx.xxxl};
    margin-top: ${spacingsPx.xl};
`;

interface CoinmarketLayoutProps {
    children: ReactNode;
    selectedAccount: SelectedAccountLoaded;
}

const CoinmarketLayout = ({ children, selectedAccount }: CoinmarketLayoutProps) => (
    <WalletLayout title="TR_NAV_TRADE" isSubpage account={selectedAccount}>
        <WalletSubpageHeading title="TR_NAV_TRADE" />
        <CoinmarketLayoutNavigation />
        <CardWrapper>{children}</CardWrapper>
        <CoinmarketFooter />
    </WalletLayout>
);

export default CoinmarketLayout;
