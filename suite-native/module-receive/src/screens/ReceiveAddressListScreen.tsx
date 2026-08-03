import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { getReceiveAddressHistoryList } from '@suite-common/address';
import { selectCurrentFreshAddress } from '@suite-common/receive';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import {
    type ReceiveStackParamList,
    ReceiveStackRoutes,
    Screen,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { type AccountAddress } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ReceiveAddressListGenerateButton } from '../components/ReceiveAddressListGenerateButton';
import { ReceiveAddressListHeader } from '../components/ReceiveAddressListHeader';
import {
    RECEIVE_ADDRESS_LIST_ITEM_MIN_HEIGHT,
    ReceiveAddressListItemRow,
} from '../components/ReceiveAddressListItemRow';
import {
    RECEIVE_ADDRESS_LIST_SEPARATOR_HEIGHT,
    ReceiveAddressListSeparator,
} from '../components/ReceiveAddressListSeparator';
import {
    type ReceiveAddressListRootState,
    selectReceiveAccount,
    selectReceiveAccountPendingAddresses,
    selectReceiveAccountSuiteSyncAddressLabels,
    selectReceiveAccountTouchedAddresses,
} from '../selectors';

const DEFAULT_BOTTOM_INSET = 25;

const listContentContainerStyle = prepareNativeStyle<{ bottomInset: number }>(
    (_, { bottomInset }) => ({
        paddingBottom: Math.max(bottomInset, DEFAULT_BOTTOM_INSET),
    }),
);

type NavigationProp = StackNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAddressList
>;

export const ReceiveAddressListScreen = () => {
    const { applyStyle } = useNativeStyles();
    const { bottom: bottomInset } = useBannerAwareSafeAreaInsets();
    const navigation = useNavigation<NavigationProp>();
    const {
        params: { accountKey },
    } = useRoute<RouteProp<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAddressList>>();

    const { networkSymbol, deviceStaticSessionId } = parseAccountKey(accountKey);

    const account = useSelector((state: ReceiveAddressListRootState) =>
        selectReceiveAccount(state, accountKey),
    );
    const touchedAddresses = useSelector((state: ReceiveAddressListRootState) =>
        selectReceiveAccountTouchedAddresses(state, accountKey),
    );
    const pendingAddresses = useSelector((state: ReceiveAddressListRootState) =>
        selectReceiveAccountPendingAddresses(state, accountKey),
    );
    const addressLabels = useSelector((state: ReceiveAddressListRootState) =>
        selectReceiveAccountSuiteSyncAddressLabels(state, accountKey),
    );
    const currentFreshAddress = useSelector((state: ReceiveAddressListRootState) =>
        selectCurrentFreshAddress(state, accountKey),
    );
    const addresses = useMemo(
        () =>
            account
                ? getReceiveAddressHistoryList({
                      account,
                      touchedAddresses,
                      pendingAddresses,
                      addressLabels,
                      currentFreshAddress,
                  })
                : [],
        [account, touchedAddresses, pendingAddresses, addressLabels, currentFreshAddress],
    );
    const nextListContentHeight =
        (addresses.length + 1) * RECEIVE_ADDRESS_LIST_ITEM_MIN_HEIGHT +
        addresses.length * RECEIVE_ADDRESS_LIST_SEPARATOR_HEIGHT;

    const navigateToAddressDetail = useCallback(
        (addressPath: string) => {
            navigation.navigate(ReceiveStackRoutes.ReceiveAddressDetail, {
                accountKey,
                addressPath,
            });
        },
        [accountKey, navigation],
    );

    const renderItem = useCallback(
        ({ item, index }: { item: AccountAddress; index: number }) => (
            <ReceiveAddressListItemRow
                address={item}
                symbol={networkSymbol}
                deviceStaticSessionId={deviceStaticSessionId}
                isFirst={index === 0}
                isLast={index === addresses.length - 1}
                onPress={navigateToAddressDetail}
            />
        ),
        [addresses.length, deviceStaticSessionId, navigateToAddressDetail, networkSymbol],
    );

    return (
        <Screen
            header={
                <ReceiveAddressListHeader
                    accountKey={accountKey}
                    rightIcon={<ReceiveAddressListGenerateButton accountKey={accountKey} />}
                />
            }
            isScrollable={false}
            noBottomPadding
            hasBottomInset={false}
            noHorizontalPadding
        >
            <FlashList
                data={addresses}
                keyExtractor={address => address.path}
                renderItem={renderItem}
                ItemSeparatorComponent={ReceiveAddressListSeparator}
                contentContainerStyle={applyStyle(listContentContainerStyle, { bottomInset })}
                // Use the next content height because the generated address is prepended.
                maintainVisibleContentPosition={{
                    autoscrollToTopThreshold: nextListContentHeight,
                }}
            />
        </Screen>
    );
};
