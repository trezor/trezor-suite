import { type ReactElement, useCallback } from 'react';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';

import { type NetworksRootState } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, useBannerAwareSafeAreaInsets, useScrollDivider } from '@suite-native/atoms';
import { useIsBottomInsetApplicable } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AccountsListEmptyPlaceholder } from './AccountsListEmptyPlaceholder';
import { AccountsListRow } from './AccountsListRow';
import {
    type FilteredDeviceAccountListRow,
    type NativeAccountsRootState,
    selectFilteredDeviceAccountListRows,
} from '../../selectors';
import { type OnSelectAccount } from '../../types';

const DEFAULT_NETWORK_FILTER: NetworkSymbol[] = [];

type AccountsListProps = {
    onSelectAccount: OnSelectAccount;
    searchValue?: string;
    isSendFlow?: boolean;
    networkFilter?: NetworkSymbol[];
    ListHeaderComponent?: ReactElement;
    ListFooterComponent?: ReactElement;
};

const footerStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    isBottomInsetApplicable: boolean;
}>((_, { insets, isBottomInsetApplicable }) => ({
    paddingBottom: isBottomInsetApplicable ? insets.bottom : 0,
}));

export const AccountsList = ({
    onSelectAccount,
    searchValue = '',
    isSendFlow = false,
    networkFilter = DEFAULT_NETWORK_FILTER,
    ListHeaderComponent,
    ListFooterComponent,
}: AccountsListProps) => {
    const { scrollDivider, handleScroll } = useScrollDivider();

    const insets = useBannerAwareSafeAreaInsets();
    const isBottomInsetApplicable = useIsBottomInsetApplicable();
    const { applyStyle } = useNativeStyles();

    const accountListRows = useSelector((state: NativeAccountsRootState & NetworksRootState) =>
        selectFilteredDeviceAccountListRows(state, searchValue, isSendFlow, networkFilter),
    );

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<FilteredDeviceAccountListRow>) => (
            <AccountsListRow
                {...item}
                hasBottomSpacing={item.isLast}
                onSelectAccount={onSelectAccount}
            />
        ),
        [onSelectAccount],
    );

    return (
        <>
            {scrollDivider}
            <FlashList
                testID="@accountList"
                data={accountListRows}
                keyExtractor={item => item.accountKey}
                renderItem={renderItem}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={
                    <AccountsListEmptyPlaceholder isFilterEmpty={!searchValue.length} />
                }
                ListFooterComponent={
                    <Box style={applyStyle(footerStyle, { insets, isBottomInsetApplicable })}>
                        {ListFooterComponent}
                    </Box>
                }
                keyboardShouldPersistTaps="handled"
                maintainVisibleContentPosition={{ disabled: true }}
                onScroll={handleScroll}
            />
        </>
    );
};
