import { type ReactElement, useCallback } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSelector } from 'react-redux';

import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';

import { type NetworksRootState } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, useScrollDivider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AccountsListEmptyPlaceholder } from './AccountsListEmptyPlaceholder';
import { AccountsListRow } from './AccountsListRow';
import {
    type FilteredDeviceAccountListRow,
    type NativeAccountsRootState,
    selectFilteredDeviceAccountListRows,
} from '../../selectors';
import { type OnSelectAccount } from '../../types';

const listStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const DEFAULT_NETWORK_FILTER: NetworkSymbol[] = [];

type AccountsListProps = {
    onSelectAccount: OnSelectAccount;
    searchValue?: string;
    isSendFlow?: boolean;
    networkFilter?: NetworkSymbol[];
    ListHeaderComponent?: ReactElement;
    ListFooterComponent?: ReactElement;
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export const AccountsList = ({
    onSelectAccount,
    searchValue = '',
    isSendFlow = false,
    networkFilter = DEFAULT_NETWORK_FILTER,
    ListHeaderComponent,
    ListFooterComponent,
    onScroll,
}: AccountsListProps) => {
    const accountListRows = useSelector((state: NativeAccountsRootState & NetworksRootState) =>
        selectFilteredDeviceAccountListRows(state, searchValue, isSendFlow, networkFilter),
    );
    const { applyStyle } = useNativeStyles();

    const renderItem = useCallback(
        ({ item, index }: ListRenderItemInfo<FilteredDeviceAccountListRow>) => (
            <AccountsListRow
                {...item}
                hasBottomSpacing={item.isLast && index < accountListRows.length - 1}
                onSelectAccount={onSelectAccount}
            />
        ),
        [accountListRows.length, onSelectAccount],
    );

    return (
        <Box flex={1}>
            <FlashList
                testID="@accountList"
                style={applyStyle(listStyle)}
                data={accountListRows}
                keyExtractor={item => item.accountKey}
                renderItem={renderItem}
                ListHeaderComponent={
                    <>
                        {ListHeaderComponent}
                        {accountListRows.length > 0 && <Box paddingTop="sp8" />}
                    </>
                }
                ListEmptyComponent={
                    <AccountsListEmptyPlaceholder isFilterEmpty={!searchValue.length} />
                }
                ListFooterComponent={ListFooterComponent}
                keyboardShouldPersistTaps="handled"
                maintainVisibleContentPosition={{ disabled: true }}
                onScroll={onScroll}
            />
        </Box>
    );
};
