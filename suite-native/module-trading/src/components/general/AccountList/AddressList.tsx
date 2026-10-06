import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';

import type { TradingType } from '@suite-common/trading';
import type { AccountKey } from '@suite-common/wallet-types';
import { Divider, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import {
    type ItemRenderConfig,
    type ListInternalItemShape,
    useSectionList,
} from '@suite-native/trading-atoms';
import { type ReceiveAccount } from '@suite-native/trading-types';
import { useDebouncedValue } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { keyExtractor } from './AccountList';
import { AccountListAddressItem } from './AccountListAddressItem';
import {
    type ReceiveAddressSection,
    useReceiveAddressesListData,
} from '../../../hooks/general/useReceiveAddressesListData';
import { useTradingReceiveAccountSelection } from '../../../hooks/general/useTradingReceiveAccountSelection';

type NavigationProp = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TradingReceiveAddress
>;

type AddressListProps = {
    accountKey: AccountKey;
    searchQuery: string;
    tradingType: Exclude<TradingType, 'sell'>;
};

const contentContainerStyle = prepareNativeStyle<{ insetBottom: number }>(
    (utils, { insetBottom }) => ({
        paddingBottom: Math.max(insetBottom, utils.spacings.sp16),
    }),
);

const listStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const itemDividerStyle = prepareNativeStyle(({ spacings }) => ({
    marginHorizontal: -spacings.sp12,
}));

export const AddressList = ({ accountKey, searchQuery, tradingType }: AddressListProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { applyStyle } = useNativeStyles();
    const { bottom: insetBottom } = useSafeAreaInsets();
    const selectReceiveAccount = useTradingReceiveAccountSelection(tradingType);
    const listRef =
        useRef<FlashListRef<ListInternalItemShape<ReceiveAccount, ReceiveAddressSection>>>(null);
    const debouncedSearchQuery = useDebouncedValue(searchQuery);

    const data = useReceiveAddressesListData({
        accountKey,
        searchQuery: debouncedSearchQuery,
    });

    useEffect(() => {
        listRef.current?.scrollToTop({ animated: false });
    }, [debouncedSearchQuery]);

    const onItemSelect = (receiveAccount: ReceiveAccount) => {
        selectReceiveAccount(receiveAccount);
        navigation.popToTop();
    };

    const renderItem = (
        item: ReceiveAccount,
        { isLast, sectionData }: ItemRenderConfig<ReceiveAddressSection>,
    ) => (
        <>
            <AccountListAddressItem
                receiveAccount={item}
                isFreshAddress={sectionData === 'unused'}
                onPress={() => onItemSelect(item)}
            />
            {!isLast && <Divider style={applyStyle(itemDividerStyle)} />}
        </>
    );

    const {
        data: internalData,
        keyExtractor: internalKeyExtractor,
        renderItem: internalRenderItem,
    } = useSectionList({
        data,
        keyExtractor,
        renderItem,
        noSingletonSectionHeader: false,
        isLastItemRounded: true,
    });

    return (
        <FlashList
            ref={listRef}
            style={applyStyle(listStyle)}
            contentContainerStyle={applyStyle(contentContainerStyle, { insetBottom })}
            ListEmptyComponent={
                <VStack flex={1} alignItems="center" justifyContent="center" spacing="sp12">
                    <Text variant="body-md">
                        <Translation id="moduleTrading.accountScreen.addressEmpty.title" />
                    </Text>
                    <Text variant="body-sm" color="contentSecondary" textAlign="center">
                        <Translation id="moduleTrading.accountScreen.addressEmpty.description" />
                    </Text>
                </VStack>
            }
            renderItem={internalRenderItem}
            data={internalData}
            keyExtractor={internalKeyExtractor}
        />
    );
};
