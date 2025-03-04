import { Translation, TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OrderedListIcon, OrderedListIconProps } from './OrderedListIcon';
import { HStack } from './Stack';
import { Text } from './Text';

const listItemStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

type BottomSheetListItemProps = OrderedListIconProps & {
    translationKey: TxKeyPath;
};

export const BottomSheetListItem = ({ translationKey, ...props }: BottomSheetListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing="sp12" alignItems="center">
            <OrderedListIcon {...props} />
            <Text style={applyStyle(listItemStyle)}>
                <Translation id={translationKey} />
            </Text>
        </HStack>
    );
};
