import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { type TradingType, tradingBuyActions, tradingExchangeActions } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { useSectionList } from '@suite-native/trading-atoms';
import {
    selectBuySelectedReceiveAccount,
    selectExchangeSelectedReceiveAccount,
} from '@suite-native/trading-state';
import { type ReceiveAccount } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AccountListAddressItem } from './AccountListAddressItem';
import { AccountListFooter } from './AccountListFooter';
import { AccountListItem } from './AccountListItem';
import { AddressListEmptyComponent } from './AddressListEmptyComponent';
import { NoAccountsComponent } from './NoAccountsComponent';
import {
    type ReceiveAccountsListMode,
    useReceiveAccountsListData,
} from '../../../hooks/general/useReceiveAccountsListData';
import { isFullySelectedReceiveAccount } from '../../../utils/general/receiveAccountUtils';

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
    tradingType: Exclude<TradingType, 'sell'>;
};

const DEFAULT_INSET_BOTTOM = 25;

const contentContainerStyle = prepareNativeStyle<{
    insetBottom: number;
}>((utils, { insetBottom }) => ({
    paddingBottom: Math.max(insetBottom, utils.spacings.sp16),
}));

export const keyExtractor = (item: ReceiveAccount) =>
    `${item.account.key}_${item.address?.address ?? 'address_undefined'}`;

export const AccountList = ({
    symbol,
    pickerMode,
    onAddAccountTap,
    onSetPickerMode,
    tradingType,
}: AccountsListProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const { bottom: insetsBottom } = useSafeAreaInsets();
    const selectReceiveAccount =
        tradingType === 'buy'
            ? selectBuySelectedReceiveAccount
            : selectExchangeSelectedReceiveAccount;
    const selectedReceiveAccount = useSelector(selectReceiveAccount);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);

    const data =
        useReceiveAccountsListData({
            symbol,
            selectedAccount: selectedReceiveAccount?.account,
            mode: pickerMode,
        }) ?? [];

    const onItemSelect = (receiveAccount: ReceiveAccount) => {
        const accountAction =
            tradingType === 'buy'
                ? tradingBuyActions.setTradingAccountKey(receiveAccount.account.key)
                : tradingExchangeActions.setReceiveAccountKey(receiveAccount.account.key);
        const addressAction =
            tradingType === 'buy'
                ? tradingBuyActions.setReceiveAddress({
                      address: receiveAccount.address?.address,
                      symbol,
                  })
                : tradingExchangeActions.setReceiveAddress({
                      address: receiveAccount.address?.address,
                      symbol,
                  });
        dispatch(accountAction);
        dispatch(addressAction);
        if (tradingType === 'buy') {
            dispatch(tradingBuyActions.setReceiveAccountKey(receiveAccount.account.key));
        }
        const hasAddresses = receiveAccount.account.addresses;
        if (receiveAccount.account && hasAddresses) {
            onSetPickerMode('address');
        }
        if (isFullySelectedReceiveAccount(receiveAccount)) {
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
        keyExtractor,
        renderItem,
        noSingletonSectionHeader: true,
        isLastItemRounded: isDeviceInViewOnlyMode || pickerMode === 'address',
    });

    const insetBottom = Math.max(insetsBottom, DEFAULT_INSET_BOTTOM);

    const shouldHaveFooter = !isDeviceInViewOnlyMode && pickerMode === 'account';

    const footer = shouldHaveFooter ? (
        <AccountListFooter hasTextualDivider={itemsCount > 0} onAddAccountTap={onAddAccountTap} />
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
            keyExtractor={internalKeyExtractor}
        />
    );
};
