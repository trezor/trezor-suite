import { Dispatch, ReactNode, SetStateAction } from 'react';

import { WalletLayout } from 'src/components/wallet';
import { TokensLayoutNavigation } from './TokensLayoutNavigation';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';

interface TokensLayoutProps {
    children: ReactNode;
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
}

export const TokensLayout = ({
    children,
    selectedAccount,
    searchQuery,
    setSearchQuery,
}: TokensLayoutProps) => (
    <WalletLayout title="TR_TOKENS" account={selectedAccount}>
        <TokensLayoutNavigation
            selectedAccount={selectedAccount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        />
        {children}
    </WalletLayout>
);
