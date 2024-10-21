import { useState } from 'react';

import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { CoinsTable } from './coins/CoinsTable';
import { Route, Switch } from 'react-router-dom';
import { TokensNavigation } from './TokensNavigation';
import { HiddenTokensTable } from './hidden-tokens/HiddenTokensTable';

export const Tokens = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const { selectedAccount } = useSelector(state => state.wallet);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_TOKENS" account={selectedAccount} />;
    }

    return (
        <WalletLayout title="TR_TOKENS" account={selectedAccount}>
            <TokensNavigation
                selectedAccount={selectedAccount}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />
            <Switch>
                <Route path="/accounts/tokens/hidden">
                    <HiddenTokensTable
                        selectedAccount={selectedAccount}
                        searchQuery={searchQuery}
                    />
                </Route>
                <Route path="*">
                    <CoinsTable selectedAccount={selectedAccount} searchQuery={searchQuery} />
                </Route>
            </Switch>
        </WalletLayout>
    );
};

export default Tokens;
