import { type ReactNode } from 'react';

import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type YieldPendingTransactionModalRowProps = {
    children: ReactNode;
    label: ReactNode;
    noBorder?: boolean;
};

const rowStyle = prepareNativeStyle<{ noBorder?: boolean }>((utils, { noBorder }) => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    borderTopWidth: noBorder ? 0 : utils.borders.widths.small,
    borderTopColor: utils.colors.borderNeutral,
    alignItems: 'center',
    justifyContent: 'space-between',
}));

const valueWrapperStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    minWidth: 0,
    alignItems: 'flex-end',
}));

export const YieldPendingTransactionModalRow = ({
    children,
    label,
    noBorder,
}: YieldPendingTransactionModalRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack style={applyStyle(rowStyle, { noBorder })} spacing="sp16">
            <Text variant="body-sm" color="contentSecondary">
                {label}
            </Text>
            <Box style={applyStyle(valueWrapperStyle)}>{children}</Box>
        </HStack>
    );
};
