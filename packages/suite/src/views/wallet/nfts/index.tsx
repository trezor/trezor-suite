import { useEffect, useState } from 'react';

import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { WalletLayout } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

import { NftsTablesSection } from './NftsTablesSection';
import { TokensNavigation } from '../tokens/TokensNavigation';

export const Nfts = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const routeName = useSelector(selectRouteName);

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

    const isHidden = routeName === 'wallet-nfts-hidden';

    return (
        <WalletLayout title="TR_NAV_NFTS" account={selectedAccount} isSubpage={false}>
            <Column gap={spacings.lg}>
                <TokensNavigation
                    selectedAccount={selectedAccount}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isNft
                />
                <NftsTablesSection
                    selectedAccount={selectedAccount}
                    searchQuery={searchQuery}
                    isShown={!isHidden}
                />
            </Column>
        </WalletLayout>
    );
};

export default Nfts;
