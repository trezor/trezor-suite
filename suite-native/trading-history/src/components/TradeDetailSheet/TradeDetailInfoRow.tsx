import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TradeDetailInfoRowProps = {
    title: ReactNode;
    content: ReactNode;
    contentTestID?: string;
    onPress?: () => void;
    borderBottom?: boolean;
};

export const DETAIL_INFO_ROW_MIN_HEIGHT = 66;

const wrapperStyle = prepareNativeStyle<{ borderBottom?: boolean }>(
    ({ spacings, colors, borders }, { borderBottom }) => ({
        justifyContent: 'space-between',
        minHeight: DETAIL_INFO_ROW_MIN_HEIGHT,
        alignItems: 'center',
        paddingHorizontal: spacings.sp16,
        borderBottomWidth: borderBottom ? borders.widths.small : 0,
        borderBottomColor: colors.surfaceFillPage,
    }),
);

const titleStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

export const TradeDetailInfoRow = ({
    title,
    content,
    contentTestID,
    onPress,
    borderBottom = false,
}: TradeDetailInfoRowProps) => {
    const { applyStyle } = useNativeStyles();

    const row = (
        <HStack style={applyStyle(wrapperStyle, { borderBottom })}>
            <Text variant="body-sm" color="contentSecondary" style={applyStyle(titleStyle)}>
                {title}
            </Text>
            {typeof content === 'string' ? (
                <Text variant="body-sm" testID={contentTestID}>
                    {content}
                </Text>
            ) : (
                content
            )}
        </HStack>
    );

    if (!onPress) {
        return row;
    }

    return <Pressable onPress={onPress}>{row}</Pressable>;
};
