import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { selectFullSelectedAccount } from '@suite/account';
import { goto } from '@suite/router';
import { Column } from '@trezor/components';

import { Route } from 'src/components/suite/Route';
import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';

import { NftsTablesSection } from './NftsTablesSection';
import { TokensNavigation } from '../tokens/TokensNavigation';

export const Nfts = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const selectedAccount = useSelector(selectFullSelectedAccount);

    const dispatch = useDispatch();

    useEffect(() => {
        if (
            selectedAccount.status === 'loaded' &&
            !selectedAccount.network?.features.includes('nfts')
        ) {
            dispatch(goto({ routeName: 'wallet-index', preserveParams: true }));
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

export default Nfts;
