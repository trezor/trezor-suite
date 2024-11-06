import { useState, useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import { WalletLayout } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';

import { CoinsTable } from './coins/CoinsTable';
import { TokensNavigation } from './TokensNavigation';
import { HiddenTokensTable } from './hidden-tokens/HiddenTokensTable';


export const Tokens = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const { selectedAccount } = useSelector(state => state.wallet);
    const dispatch = useDispatch();

    useEffect(() => {
        if (
            selectedAccount.status === 'loaded' &&
            !selectedAccount.network?.features.includes('tokens')
        ) {
            dispatch(goto('wallet-index', { preserveParams: true }));
        }
    }, [selectedAccount, dispatch]);

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
