import { type PropsWithChildren } from 'react';
import { Pressable } from 'react-native';

import { HStack } from '@suite-native/atoms';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const infoRowStyle = prepareNativeStyle<{
    noBorder?: boolean;
    noHorizontalPadding?: boolean;
    noVerticalPadding?: boolean;
}>(({ spacings, colors, borders }, { noBorder, noHorizontalPadding, noVerticalPadding }) => ({
    paddingHorizontal: noHorizontalPadding ? 0 : spacings.sp16,
    paddingVertical: noVerticalPadding ? 0 : spacings.sp12,
    borderTopColor: colors.borderNeutral,
    borderTopWidth: noBorder ? 0 : borders.widths.small,
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: spacings.sp52,
}));

type TradeInfoRowProps = PropsWithChildren<{
    noBorder?: boolean;
    onPress?: () => void;
    testID?: string;
    style?: NativeStyleObject;
    noHorizontalPadding?: boolean;
    noVerticalPadding?: boolean;
}>;

export const TradeInfoRow = ({
    children,
    noBorder,
    onPress,
    testID,
    style,
    noHorizontalPadding,
    noVerticalPadding,
}: TradeInfoRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress} testID={testID}>
            <HStack
                style={[
                    applyStyle(infoRowStyle, { noBorder, noHorizontalPadding, noVerticalPadding }),
                    style,
                ]}
            >
                {children}
            </HStack>
        </Pressable>
    );
};
