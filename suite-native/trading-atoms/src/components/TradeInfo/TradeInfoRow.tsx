import { Pressable } from 'react-native';

import { HStack, type StackProps } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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

type TradeInfoRowProps = StackProps & {
    noBorder?: boolean;
    onPress?: () => void;
    noHorizontalPadding?: boolean;
    noVerticalPadding?: boolean;
};

export const TradeInfoRow = ({
    children,
    noBorder,
    onPress,
    testID,
    style,
    noHorizontalPadding,
    noVerticalPadding,
    ...rest
}: TradeInfoRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress} testID={testID}>
            <HStack
                {...rest}
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
