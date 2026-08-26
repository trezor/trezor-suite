import { useCallback, useRef } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { sendFormActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { Box, Divider } from '@trezor/components';
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
    ExpandableAssetRowGroup,
} from 'src/components/suite/asset-picker/components';
import {
    type AssetPickerListItem,
    useExpandableAccountGroups,
    useFilterAccountsWithTokens,
    useInsertGroupLabelsAndSpaces,
} from 'src/components/suite/asset-picker/hooks';
import { createTokenOption } from 'src/components/suite/asset-picker/utils';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { globalSendReceiveFiltersSelectors } from 'src/slices/wallet/globalSendReceiveFilters';

import { AssetSearchWithNetworkFilter } from '../AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter';
import { useAccountWithTokensOptions } from './hooks/useAccountWithTokensOptions';

type GlobalSendModalProps = {
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, filledSearch: boolean) => void;
};

const LIST_HEIGHT = 480;

export function GlobalSendModal({ onCancel, onSubmit }: GlobalSendModalProps) {
    const dispatch = useDispatch();

    const networkSymbolFilter = useSelector(globalSendReceiveFiltersSelectors.selectNetworkSymbol);
    const searchFilter = useSelector(globalSendReceiveFiltersSelectors.selectSearch);
    const { expandedAccountTokensGroups, updateExpandableAccountGroups } =
        useExpandableAccountGroups();
    const device = useSelector(selectSelectedDevice);

    const accountsWithTokens = useAccountWithTokensOptions({
        networkSymbolFilter,
        expandedHiddenTokensGroups: expandedAccountTokensGroups,
        staticSessionId: device?.state?.staticSessionId ?? null,
    });

    const filteredAccountsWithTokens = useFilterAccountsWithTokens(
        accountsWithTokens,
        searchFilter,
    );
    const globalSendListItems = useInsertGroupLabelsAndSpaces(filteredAccountsWithTokens);

    const submitRef = useCurrentRef(onSubmit);
    const listRef = useRef<HTMLDivElement>(null);
    const filledSearch = useSelector(globalSendReceiveFiltersSelectors.filledSearch);

    const handleAccountClick = useCallback(
        (account: Account) => {
            dispatch(sendFormActions.removeDraft({ accountKey: account.key }));
            submitRef.current?.(account, filledSearch);
        },
        [submitRef, filledSearch, dispatch],
    );
    const handleTokenClick = useCallback(
        (token: TokenInfo, account: Account) => {
            dispatch(sendFormActions.removeDraft({ accountKey: account.key }));
            dispatch(setSendFormPrefill({ contractAddress: token.contract }));
            submitRef.current?.(account, filledSearch);
        },
        [submitRef, filledSearch, dispatch],
    );

    const renderItem = useCallback(
        (item: AssetPickerListItem) => {
            switch (item.type) {
                case 'group-label':
                    return <AssetGroupLabel label={item.label} />;

                case 'group-space':
                    return <AssetGroupSpace size={item.size} />;

                case 'account':
                    return (
                        <AssetRowAccountWithBalance
                            dataTestId={`@asset-picker/send/option/${item.account.accountType}/${item.account.symbol}/${item.account.index}`}
                            account={item.account}
                            onClick={handleAccountClick}
                        />
                    );

                case 'token':
                    return (
                        <AssetRowToken
                            dataTestId={`@asset-picker/send/option/${item.account.accountType}/${item.account.symbol}/${item.account.index}/token/${item.token.symbol}`}
                            token={item.token}
                            account={item.account}
                            onClick={handleTokenClick}
                        />
                    );

                case 'hidden-tokens':
                    return (
                        <ExpandableAssetRowGroup
                            label="TR_HIDDEN_TOKENS"
                            account={item.account}
                            items={item.tokens.map(token => createTokenOption(item.account, token))}
                            renderItem={groupItem =>
                                groupItem.type === 'token' && (
                                    <AssetRowToken
                                        token={groupItem.token}
                                        account={groupItem.account}
                                        onClick={handleTokenClick}
                                        isInsideGroup
                                    />
                                )
                            }
                            expanded={item.expanded}
                            height={item.height}
                            onExpandToggle={expanded => {
                                updateExpandableAccountGroups(item.account.key, expanded);
                            }}
                        />
                    );
            }
        },
        [handleAccountClick, handleTokenClick, updateExpandableAccountGroups],
    );

    return (
        <AssetsModal heading={{ id: 'SEND_TRANSACTION' }} onClose={() => onCancel(filledSearch)}>
            <Box padding={{ horizontal: 16 }}>
                <AssetSearchWithNetworkFilter
                    placeholder="TR_SEND_SEARCH"
                    listRef={listRef}
                    modal="send"
                />
            </Box>

            <Divider margin={{ top: 16 }} />

            <AssetsListEmpty
                isEmpty={filteredAccountsWithTokens.length === 0}
                heading={filledSearch ? 'TR_ACCOUNT_SEARCH_NO_RESULTS' : 'TR_ACCOUNT_NO_ACCOUNTS'}
                height={LIST_HEIGHT}
            >
                <AssetsList
                    items={globalSendListItems}
                    renderItem={renderItem}
                    height={LIST_HEIGHT}
                    ref={listRef}
                />
            </AssetsListEmpty>
        </AssetsModal>
    );
}
