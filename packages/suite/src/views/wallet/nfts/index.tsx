import { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { WalletLayout } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { NftsTablesSection } from './NftsTablesSection';
import { TokensNavigation } from '../tokens/TokensNavigation';

export const Nfts = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const dispatch = useDispatch();

    useEffect(() => {
        if (
            selectedAccount.status === 'loaded' &&
            !selectedAccount.network?.features.includes('nfts')
        ) {
            dispatch(goto('wallet-index', { preserveParams: true }));
        }
    }, [selectedAccount, dispatch]);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_NFTS" account={selectedAccount} />;
    }

    return (
        <WalletLayout title="TR_NAV_NFTS" account={selectedAccount} isSubpage={false}>
            <Column gap={spacings.lg}>
                <TokensNavigation
                    selectedAccount={selectedAccount}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isNft
                />
                <Switch>
                    <Route path={`${process.env.ASSET_PREFIX}/accounts/nfts/hidden`}>
                        <NftsTablesSection
                            selectedAccount={selectedAccount}
                            searchQuery={searchQuery}
                            isShown={false}
                        />
                    </Route>
                    <Route path="*">
                        <NftsTablesSection
                            selectedAccount={selectedAccount}
                            searchQuery={searchQuery}
                            isShown
                        />
                    </Route>
                </Switch>
            </Column>
        </WalletLayout>
    );
};

export default Nfts;
