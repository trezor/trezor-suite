import { useEffect, useState } from 'react';

import { selectFullSelectedAccount } from '@suite/account';
import { gotoThunk } from '@suite/router';
import { Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import {
    NftsTablesSection,
    Route,
    TokensNavigation,
    WalletLayout,
    useSelector,
} from '@trezor/suite';

export const NftsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const selectedAccount = useSelector(selectFullSelectedAccount);

    const { dispatch } = useServices(injectDispatch);

    useEffect(() => {
        if (
            selectedAccount.status === 'loaded' &&
            !selectedAccount.network?.features.includes('nfts')
        ) {
            dispatch(gotoThunk({ routeName: 'wallet-index', preserveParams: true }));
        }
    }, [selectedAccount, dispatch]);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_NFTS" account={selectedAccount} />;
    }

    return (
        <WalletLayout title="TR_NAV_NFTS" account={selectedAccount} isSubpage={false}>
            <Column gap={20}>
                <TokensNavigation
                    selectedAccount={selectedAccount}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isNft
                />
                <Route
                    name="wallet-nfts-hidden"
                    fallback={
                        <NftsTablesSection
                            selectedAccount={selectedAccount}
                            searchQuery={searchQuery}
                            isShown
                        />
                    }
                >
                    <NftsTablesSection
                        selectedAccount={selectedAccount}
                        searchQuery={searchQuery}
                        isShown={false}
                    />
                </Route>
            </Column>
        </WalletLayout>
    );
};
