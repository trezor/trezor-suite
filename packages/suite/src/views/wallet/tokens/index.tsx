import { useEffect, useState } from 'react';

import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Route } from 'src/components/suite/Route';
import { WalletLayout } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';

import { TokensNavigation } from './TokensNavigation';
import { CoinsTable } from './coins/CoinsTable';
import { HiddenTokensTable } from './hidden-tokens/HiddenTokensTable';
import { InactiveTokensTable } from './inactive-tokens/InactiveTokensTable';

export const Tokens = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const dispatch = useDispatch();
    const routeName = useSelector(selectRouteName);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    useEffect(() => {
        if (
            selectedAccount.status === 'loaded' &&
            !hasNetworkFeatures(selectedAccount.account, 'tokens', isDebugModeActive) &&
            routeName !== 'wallet-index'
        ) {
            dispatch(goto('wallet-index', { preserveParams: true }));
        }
    }, [selectedAccount, dispatch, routeName, isDebugModeActive]);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_TOKENS" account={selectedAccount} />;
    }

    return (
        <WalletLayout title="TR_TOKENS" account={selectedAccount}>
            <Column gap={spacings.lg}>
                <TokensNavigation
                    selectedAccount={selectedAccount}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
                <Route name="wallet-tokens">
                    <CoinsTable selectedAccount={selectedAccount} searchQuery={searchQuery} />
                </Route>
                <Route name="wallet-tokens-hidden">
                    <HiddenTokensTable
                        selectedAccount={selectedAccount}
                        searchQuery={searchQuery}
                    />
                </Route>
                <Route name="wallet-tokens-inactive">
                    <InactiveTokensTable
                        selectedAccount={selectedAccount}
                        searchQuery={searchQuery}
                    />
                </Route>
            </Column>
        </WalletLayout>
    );
};

export default Tokens;
