import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { type TradingType } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Divider } from '@suite-native/atoms';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { type SectionListData, useSectionList } from '@suite-native/trading-atoms';
import { type ReceiveAccount } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AccountListFooter } from './AccountListFooter';
import { AccountListItem } from './AccountListItem';
import { NoAccountsComponent } from './NoAccountsComponent';
import { useTradingReceiveAccountSelection } from '../../../hooks/general/useTradingReceiveAccountSelection';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.ReceiveAccounts>;

export type AccountsListProps = {
    data: SectionListData<ReceiveAccount>;
    symbol: NetworkSymbol;
    onAddAccountTap: () => void;
    tradingType: Exclude<TradingType, 'sell'>;
};

const contentContainerStyle = prepareNativeStyle<{
    insetBottom: number;
}>((utils, { insetBottom }) => ({
    paddingBottom: Math.max(insetBottom, utils.spacings.sp16),
}));

export const keyExtractor = (item: ReceiveAccount) =>
    `${item.account.key}_${item.address?.address ?? 'address_undefined'}`;

export const AccountList = ({ data, symbol, onAddAccountTap, tradingType }: AccountsListProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { applyStyle } = useNativeStyles();
    const { bottom: insetBottom } = useSafeAreaInsets();
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const selectReceiveAccount = useTradingReceiveAccountSelection(tradingType);

    const onItemSelect = (receiveAccount: ReceiveAccount) => {
        if (receiveAccount.account.addresses) {
            navigation.navigate(RootStackRoutes.TradingReceiveAddress, {
                accountKey: receiveAccount.account.key,
                tradingType,
            });

            return;
        }

        selectReceiveAccount(receiveAccount);
        navigation.popToTop();
    };

    const renderItem = (item: ReceiveAccount) => (
        <AccountListItem receiveAccount={item} onPress={() => onItemSelect(item)} />
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
        isLastItemRounded: true,
    });

    const shouldHaveFooter = !isDeviceInViewOnlyMode;

    const footer = shouldHaveFooter ? (
        <AccountListFooter onAddAccountTap={onAddAccountTap} />
    ) : undefined;

    if (itemsCount === 0) {
        return <NoAccountsComponent symbol={symbol} onActivateAccount={onAddAccountTap} />;
    }

    return (
        <FlashList
            contentContainerStyle={applyStyle(contentContainerStyle, {
                insetBottom,
            })}
            renderItem={internalRenderItem}
            ItemSeparatorComponent={Divider}
            ListFooterComponent={footer}
            data={internalData}
            keyExtractor={internalKeyExtractor}
        />
    );
};
