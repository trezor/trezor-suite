import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router';

import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { WalletLayout } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

import { TokensNavigation } from './TokensNavigation';
import { CoinsTable } from './coins/CoinsTable';
import { HiddenTokensTable } from './hidden-tokens/HiddenTokensTable';

export const Tokens = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const dispatch = useDispatch();
    const routeName = useSelector(selectRouteName);

    useEffect(() => {
        if (
            selectedAccount.status === 'loaded' &&
            !hasNetworkFeatures(selectedAccount.account, 'tokens') &&
            routeName !== 'wallet-index'
        ) {
            dispatch(goto('wallet-index', { preserveParams: true }));
        }
    }, [selectedAccount, dispatch, routeName]);

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
                <Routes>
                    <Route
                        path="hidden"
                        element={
                            <HiddenTokensTable
                                selectedAccount={selectedAccount}
                                searchQuery={searchQuery}
                            />
                        }
                    />
                    <Route
                        path="*"
                        element={
                            <CoinsTable
                                selectedAccount={selectedAccount}
                                searchQuery={searchQuery}
                            />
                        }
                    />
                </Routes>
            </Column>
        </WalletLayout>
    );
};

export default Tokens;
