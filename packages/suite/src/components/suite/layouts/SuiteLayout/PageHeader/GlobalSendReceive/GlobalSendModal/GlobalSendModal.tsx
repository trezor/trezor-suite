import { useCallback, useRef } from 'react';

import { Account } from '@suite-common/wallet-types';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { Divider } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';

import { setSendFormPrefill } from 'src/actions/suite/suiteActions';
import {
    AssetGroupLabel,
    AssetGroupSpace,
    AssetRowAccountWithBalance,
    AssetRowToken,
    AssetsList,
    AssetsListEmpty,
    AssetsModal,
} from 'src/components/suite/asset-picker/components';
import { useDataFingerprint } from 'src/components/suite/asset-picker/hooks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';

import { useAccountWithTokensOptions } from './hooks/useAccountWithTokensOptions';
import { useFilterAccountsWithTokens } from './hooks/useFilterAccountsWithTokens';
import {
    GlobalSendListItem,
    useInsertGroupLabelsAndSpaces,
} from './hooks/useInsertGroupLabelsAndSpaces';
import { AssetSearchWithNetworkFilter } from '../AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter';

type GlobalSendModalProps = {
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, filledSearch: boolean) => void;
};

const LIST_HEIGHT = 500;

export function GlobalSendModal({ onCancel, onSubmit }: GlobalSendModalProps) {
    const dispatch = useDispatch();

    const accountsWithTokens = useAccountWithTokensOptions();
    const filteredAccountsWithTokens = useFilterAccountsWithTokens(accountsWithTokens);
    const fingerprintWithTokens = useDataFingerprint(filteredAccountsWithTokens);
    const globalSendListItems = useInsertGroupLabelsAndSpaces(filteredAccountsWithTokens);

    const submitRef = useCurrentRef(onSubmit);
    const listRef = useRef<HTMLDivElement>(null);
    const filledSearch = useSelector(globalSendReceiveFilters.selectors.filledSearch);

    const handleAccountClick = useCallback(
        (account: Account) => {
            submitRef.current?.(account, filledSearch);
        },
        [submitRef, filledSearch],
    );
    const handleTokenClick = useCallback(
        (token: TokenInfo, account: Account) => {
            submitRef.current?.(account, filledSearch);
            dispatch(setSendFormPrefill({ contractAddress: token.contract }));
        },
        [submitRef, filledSearch, dispatch],
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
                        <AssetRowAccountWithBalance
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
        <AssetsModal heading={{ id: 'SEND_TRANSACTION' }} onClose={() => onCancel(filledSearch)}>
            <AssetSearchWithNetworkFilter
                placeholder="TR_SEND_SEARCH"
                listRef={listRef}
                modal="send"
            />

            <Divider />

            <AssetsListEmpty
                isEmpty={filteredAccountsWithTokens.length === 0}
                heading={filledSearch ? 'TR_ACCOUNT_SEARCH_NO_RESULTS' : 'TR_ACCOUNT_NO_ACCOUNTS'}
                height={LIST_HEIGHT}
            >
                <AssetsList
                    items={globalSendListItems}
                    itemsFingerprint={fingerprintWithTokens}
                    renderItem={renderItem}
                    height={LIST_HEIGHT}
                    ref={listRef}
                />
            </AssetsListEmpty>
        </AssetsModal>
    );
}
