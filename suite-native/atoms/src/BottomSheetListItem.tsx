import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { IconSquare, type IconSquareProps } from './Icon/IconSquare';
import { HStack } from './Stack';
import { Text } from './Text';

const listItemStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

type BottomSheetListItemProps = IconSquareProps & {
    translationKey: TxKeyPath;
    translationValues?: Record<string, string | undefined>;
};

export const BottomSheetListItem = ({
    translationKey,
    translationValues,
    ...props
}: BottomSheetListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing="sp12" alignItems="center">
            <IconSquare {...props} />
            <Text style={applyStyle(listItemStyle)}>
                <Translation id={translationKey} values={translationValues} />
            </Text>
        </HStack>
    );
};
