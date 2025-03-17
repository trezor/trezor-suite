import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsDeviceInViewOnlyMode } from '@suite-common/wallet-core';
import {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AccountListAddressItem } from './AccountListAddressItem';
import { ACCOUNT_LIST_ITEM_HEIGHT } from './AccountListBaseItem';
import { AccountListItem } from './AccountListItem';
import { AccountsListFooter } from './AccountsListFooter';
import { AddressListEmptyComponent } from './AddressListEmptyComponent';
import { NoAccountsComponent } from './NoAccountsComponent';
import {
    ReceiveAccountsListMode,
    useReceiveAccountsListData,
} from '../../../hooks/useReceiveAccountsListData';
import { useSectionList } from '../../../hooks/useSectionList';
import {
    selectBuySelectedReceiveAccount,
    setBuySelectedReceiveAccount,
} from '../../../tradingSlice';
import { ReceiveAccount } from '../../../types';

type NavigationProp = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

export type AccountsListProps = {
    symbol: NetworkSymbol;
    pickerMode: ReceiveAccountsListMode;
    onAddAccountTap: () => void;
    onSetPickerMode: (mode: ReceiveAccountsListMode) => void;
};

const DEFAULT_INSET_BOTTOM = 25;

const contentContainerStyle = prepareNativeStyle<{
    insetBottom: number;
}>((utils, { insetBottom }) => ({
    paddingBottom: Math.max(insetBottom, utils.spacings.sp16),
}));

export const keyExtractor = (item: ReceiveAccount) =>
    `${item.account.key}_${item.address?.address ?? 'address_undefined'}`;

export const AccountsList = ({
    symbol,
    pickerMode,
    onAddAccountTap,
    onSetPickerMode,
}: AccountsListProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const { bottom: insetsBottom } = useSafeAreaInsets();
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);

    const data =
        useReceiveAccountsListData({
            symbol,
            selectedAccount: selectedReceiveAccount?.account,
            mode: pickerMode,
        }) ?? [];

    const onItemSelect = (receiveAccount: ReceiveAccount) => {
        dispatch(setBuySelectedReceiveAccount({ selectedReceiveAccount: receiveAccount }));
        const hasAddresses = receiveAccount.account.addresses;
        if (receiveAccount.account && hasAddresses) {
            onSetPickerMode('address');
        }
        if ((hasAddresses && receiveAccount.address) || !hasAddresses) {
            navigation.popToTop();
        }
    };

    const renderItem = (item: ReceiveAccount) =>
        pickerMode === 'account' ? (
            <AccountListItem receiveAccount={item} onPress={() => onItemSelect(item)} />
        ) : (
            <AccountListAddressItem receiveAccount={item} onPress={() => onItemSelect(item)} />
        );

    const {
        data: internalData,
        keyExtractor: internalKeyExtractor,
        renderItem: internalRenderItem,
        itemsCount,
    } = useSectionList({
        data,
        estimatedItemSize: ACCOUNT_LIST_ITEM_HEIGHT,
        keyExtractor,
        renderItem,
        noSingletonSectionHeader: true,
        isLastItemRounded: isDeviceInViewOnlyMode || pickerMode === 'address',
    });

    const insetBottom = Math.max(insetsBottom, DEFAULT_INSET_BOTTOM);

    const shouldHaveFooter = !isDeviceInViewOnlyMode && pickerMode === 'account';

    const footer = shouldHaveFooter ? (
        <AccountsListFooter hasTextualDivider={itemsCount > 0} onAddAccountTap={onAddAccountTap} />
    ) : null;

    const filter = '';
    const emptyComponent =
        filter.length > 0 ? (
            <AddressListEmptyComponent />
        ) : (
            <NoAccountsComponent isBottomRounded={isDeviceInViewOnlyMode} />
        );

    return (
        <FlashList
            contentContainerStyle={applyStyle(contentContainerStyle, {
                insetBottom,
            })}
            ListEmptyComponent={emptyComponent}
            renderItem={internalRenderItem}
            ListFooterComponent={footer}
            data={internalData}
            estimatedItemSize={ACCOUNT_LIST_ITEM_HEIGHT}
            keyExtractor={internalKeyExtractor}
        />
    );
};
