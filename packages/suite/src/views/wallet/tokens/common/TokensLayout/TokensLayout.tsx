import { ReactNode } from 'react';

import { WalletLayout } from 'src/components/wallet';
import { TokensLayoutNavigation } from './TokensLayoutNavigation';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';

interface TokensLayoutProps {
    children: ReactNode;
    selectedAccount: SelectedAccountLoaded;
}

export const TokensLayout = ({ children, selectedAccount }: TokensLayoutProps) => (
    <WalletLayout title="TR_TOKENS" account={selectedAccount}>
        <TokensLayoutNavigation selectedAccount={selectedAccount} />
        {children}
    </WalletLayout>
);
