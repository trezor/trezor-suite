import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { PressableOpacity } from '@suite-native/atoms';
import { type AccountAddress, type StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ReceiveAddressListItem } from './ReceiveAddressListItem';

type ListItemContainerStyleProps = {
    isFirst: boolean;
    isLast: boolean;
};

type ReceiveAddressListItemRowProps = {
    address: AccountAddress;
    deviceStaticSessionId: StaticSessionId;
    isFresh: boolean;
    isFirst: boolean;
    isLast: boolean;
    onPress: (addressPath: string) => void;
    symbol: NetworkSymbol;
};

export const RECEIVE_ADDRESS_LIST_ITEM_MIN_HEIGHT = 70;

const listItemContainerStyle = prepareNativeStyle<ListItemContainerStyleProps>(
    (utils, { isFirst, isLast }) => ({
        minHeight: RECEIVE_ADDRESS_LIST_ITEM_MIN_HEIGHT,
        justifyContent: 'center',
        backgroundColor: utils.colors.surfaceFillRaised,
        marginHorizontal: utils.spacings.sp16,
        paddingHorizontal: utils.spacings.sp16,
        paddingVertical: utils.spacings.sp12,
        extend: [
            {
                condition: isFirst,
                style: {
                    borderTopLeftRadius: utils.borders.radii.r16,
                    borderTopRightRadius: utils.borders.radii.r16,
                },
            },
            {
                condition: isLast,
                style: {
                    borderBottomLeftRadius: utils.borders.radii.r16,
                    borderBottomRightRadius: utils.borders.radii.r16,
                },
            },
        ],
    }),
);

export const ReceiveAddressListItemRow = ({
    address,
    deviceStaticSessionId,
    isFresh,
    isFirst,
    isLast,
    onPress,
    symbol,
}: ReceiveAddressListItemRowProps) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const { applyStyle } = useNativeStyles();

    const handlePress = useCallback(() => {
        if (!isFresh) {
            analytics.report({ type: events.receiveOpenNonFreshAddressEvent.name });
        }

        onPress(address.path);
    }, [address.path, analytics, isFresh, onPress]);

    return (
        <PressableOpacity
            accessibilityRole="button"
            onPress={handlePress}
            style={applyStyle(listItemContainerStyle, { isFirst, isLast })}
        >
            <ReceiveAddressListItem
                address={address}
                symbol={symbol}
                deviceStaticSessionId={deviceStaticSessionId}
            />
        </PressableOpacity>
    );
};
