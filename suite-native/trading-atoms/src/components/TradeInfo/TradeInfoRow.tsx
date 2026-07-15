import { type PropsWithChildren } from 'react';
import { Pressable } from 'react-native';

import { HStack } from '@suite-native/atoms';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const infoRowStyle = prepareNativeStyle<{ noBorder?: boolean }>(
    ({ spacings, colors, borders }, { noBorder }) => ({
        paddingHorizontal: spacings.sp16,
        paddingVertical: spacings.sp12,
        borderTopColor: colors.borderNeutral,
        borderTopWidth: noBorder ? 0 : borders.widths.small,
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: spacings.sp52,
    }),
);

type TradeInfoRowProps = PropsWithChildren<{
    noBorder?: boolean;
    onPress?: () => void;
    testID?: string;
    style?: NativeStyleObject;
}>;

export const TradeInfoRow = ({ children, noBorder, onPress, testID, style }: TradeInfoRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress} testID={testID}>
            <HStack style={[applyStyle(infoRowStyle, { noBorder }), style]}>{children}</HStack>
        </Pressable>
    );
};
