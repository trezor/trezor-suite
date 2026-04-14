import { type PropsWithChildren } from 'react';
import { Pressable } from 'react-native';

import { HStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const infoRowStyle = prepareNativeStyle<{ noBorder?: boolean }>((utils, { noBorder }) => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    borderTopColor: utils.colors.borderNeutral,
    borderTopWidth: noBorder ? 0 : 1,
    justifyContent: 'space-between',
    alignItems: 'center',
}));

type TradeInfoRowProps = PropsWithChildren<{
    noBorder?: boolean;
    onPress?: () => void;
    testID?: string;
}>;

export const TradeInfoRow = ({ children, noBorder, onPress, testID }: TradeInfoRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress} testID={testID}>
            <HStack style={applyStyle(infoRowStyle, { noBorder })}>{children}</HStack>
        </Pressable>
    );
};
