import { useState } from 'react';

import { WalletLayout } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { CoinsTable } from './coins/CoinsTable';
import { Route, Switch } from 'react-router-dom';
import { TokensNavigation } from './TokensNavigation';
import { HiddenTokensTable } from './hidden-tokens/HiddenTokensTable';
import { goto } from 'src/actions/suite/routerActions';

export const Tokens = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const { selectedAccount } = useSelector(state => state.wallet);
    const dispatch = useDispatch();

    if (!selectedAccount.network?.features.includes('tokens')) {
        dispatch(goto('wallet-index', { preserveParams: true }));
    }

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
                <Route path={`${process.env.ASSET_PREFIX}/accounts/tokens/hidden`}>
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
