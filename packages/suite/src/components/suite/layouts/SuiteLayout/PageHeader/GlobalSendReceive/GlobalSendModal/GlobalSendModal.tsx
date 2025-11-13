import { useCallback, useState } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { Divider } from '@trezor/components';

import {
    AssetGroupLabel,
    AssetGroupSpace,
    AssetRowAccount,
    AssetRowToken,
    AssetSearchWithNetworkFilter,
    AssetsList,
    AssetsListEmpty,
    AssetsModal,
} from 'src/components/suite/asset-picker/components';
import { useDataFingerprint } from 'src/components/suite/asset-picker/hooks';
import { useCurrentRef } from 'src/hooks/general/useCurrentRef';
import { AccountItemType } from 'src/types/wallet';

import { useAccountWithTokensOptions } from './hooks/useAccountWithTokensOptions';
import { useFilterAccountsWithTokens } from './hooks/useFilterAccountsWithTokens';
import {
    GlobalSendListItem,
    useInsertGroupLabelsAndSpaces,
} from './hooks/useInsertGroupLabelsAndSpaces';

type GlobalSendModalProps = {
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, type: AccountItemType, filledSearch: boolean) => void;
};

const LIST_HEIGHT = 500;

export function GlobalSendModal({ onCancel, onSubmit }: GlobalSendModalProps) {
    const [search, setSearch] = useState('');
    const [networkSymbol, setNetworkSymbol] = useState<NetworkSymbol | undefined>(undefined);

    const accountsWithTokens = useAccountWithTokensOptions(networkSymbol);
    const filteredAccountsWithTokens = useFilterAccountsWithTokens(accountsWithTokens, {
        search,
    });
    const fingerprintWithTokens = useDataFingerprint(filteredAccountsWithTokens);
    const globalSendListItems = useInsertGroupLabelsAndSpaces(filteredAccountsWithTokens);

    const submitRef = useCurrentRef(onSubmit);
    const searchRef = useCurrentRef(search);

    const handleAccountClick = useCallback(
        (account: Account) => {
            submitRef.current?.(account, 'coin', Boolean(searchRef.current?.length));
        },
        [submitRef, searchRef],
    );
    const handleTokenClick = useCallback(
        (token: TokenInfo, account: Account) => {
            // TODO: add 'token' type
            submitRef.current?.(account, 'tokens', Boolean(searchRef.current?.length));
        },
        [submitRef, searchRef],
    );

    const renderItem = useCallback(
        (item: GlobalSendListItem) => {
            switch (item.type) {
                case 'group-label':
                    return <AssetGroupLabel label={item.label} />;

                case 'group-space':
                    return <AssetGroupSpace size="md" />;

                case 'account':
                    return (
                        <AssetRowAccount
                            variant="from-account"
                            account={item.account}
                            onClick={handleAccountClick}
                        />
                    );

                case 'token':
                    return (
                        <AssetRowToken
                            token={item.token}
                            account={item.account}
                            onClick={handleTokenClick}
                        />
                    );
            }
        },
        [handleAccountClick, handleTokenClick],
    );

    return (
        <AssetsModal
            heading={{ id: 'SEND_TRANSACTION' }}
            onClose={() => onCancel(search.length > 0)}
        >
            <AssetSearchWithNetworkFilter
                onNetworkFilter={setNetworkSymbol}
                onSearch={setSearch}
                placeholder="TR_SEND_SEARCH"
            />

            <Divider />

            <AssetsListEmpty
                isEmpty={filteredAccountsWithTokens.length === 0}
                heading={
                    search.length > 0 ? 'TR_ACCOUNT_SEARCH_NO_RESULTS' : 'TR_ACCOUNT_NO_ACCOUNTS'
                }
                height={LIST_HEIGHT}
            >
                <AssetsList
                    items={globalSendListItems}
                    itemsFingerprint={fingerprintWithTokens}
                    renderItem={renderItem}
                    height={LIST_HEIGHT}
                />
            </AssetsListEmpty>
        </AssetsModal>
    );
}
