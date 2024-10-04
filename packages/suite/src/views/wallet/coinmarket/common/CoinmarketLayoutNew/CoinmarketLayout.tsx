import { ReactNode } from 'react';
import styled from 'styled-components';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { spacingsPx } from '@trezor/theme';
import { CoinmarketLayoutNavigation } from './CoinmarketLayoutNavigation/CoinmarketLayoutNavigation';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';

const CoinmarketWrapper = styled.div`
    padding: 0 ${spacingsPx.lg};

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        padding: 0;
    }
`;

const CoinmarketFormWrapper = styled.div`
    margin-top: ${spacingsPx.xl};
`;

interface CoinmarketLayoutProps {
    children: ReactNode;
    selectedAccount: SelectedAccountLoaded;
}

export const CoinmarketLayout = ({ children, selectedAccount }: CoinmarketLayoutProps) => (
    <WalletLayout title="TR_NAV_TRADE" isSubpage account={selectedAccount}>
        <CoinmarketWrapper>
            <WalletSubpageHeading title="TR_NAV_TRADE" />
            <CoinmarketLayoutNavigation selectedAccount={selectedAccount} />
            <CoinmarketFormWrapper>{children}</CoinmarketFormWrapper>
            <CoinmarketFooter />
        </CoinmarketWrapper>
    </WalletLayout>
);
