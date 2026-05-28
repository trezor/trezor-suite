import { type ReactNode } from 'react';

import { HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const detailsRowStyle = prepareNativeStyle<{ isFirst: boolean }>((utils, { isFirst }) => ({
    alignItems: 'center',
    borderTopColor: utils.colors.borderNeutral,
    borderTopWidth: isFirst ? 0 : utils.borders.widths.small,
    justifyContent: 'space-between',
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
}));

type YieldDepositRevokeDetailsRowProps = {
    children: ReactNode;
    isFirst?: boolean;
    label: ReactNode;
};

export const YieldDepositRevokeDetailsRow = ({
    children,
    isFirst = false,
    label,
}: YieldDepositRevokeDetailsRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack style={applyStyle(detailsRowStyle, { isFirst })}>
            <Text variant="body-sm">{label}</Text>
            {children}
        </HStack>
    );
};
