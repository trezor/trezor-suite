import { type ReactElement, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box } from '@suite-native/atoms';
import { useScrollDivider } from '@suite-native/scrollview';
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
    isScrollDividerEnabled?: boolean;
};

export const AccountsList = ({
    onSelectAccount,
    searchValue = '',
    isSendFlow = false,
    networkFilter = DEFAULT_NETWORK_FILTER,
    ListHeaderComponent,
    ListFooterComponent,
    isScrollDividerEnabled = false,
}: AccountsListProps) => {
    const accountListRows = useSelector((state: NativeAccountsRootState) =>
        selectFilteredDeviceAccountListRows(state, searchValue, isSendFlow, networkFilter),
    );
    const { applyStyle } = useNativeStyles();
    const { scrollDivider, handleScroll } = useScrollDivider();

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
            {isScrollDividerEnabled && scrollDivider}
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
                onScroll={isScrollDividerEnabled ? handleScroll : undefined}
            />
        </Box>
    );
};
