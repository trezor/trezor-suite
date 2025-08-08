import { PropsWithChildren } from 'react';

import { HStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const infoRowStyle = prepareNativeStyle<{ noBorder?: boolean }>((utils, { noBorder }) => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    borderTopColor: utils.colors.borderOnElevation1,
    borderTopWidth: noBorder ? 0 : 1,
    justifyContent: 'space-between',
    alignItems: 'center',
}));

type TradeInfoRowProps = PropsWithChildren<{
    noBorder?: boolean;
}>;

export const TradeInfoRow = ({ children, noBorder }: TradeInfoRowProps) => {
    const { applyStyle } = useNativeStyles();

    return <HStack style={applyStyle(infoRowStyle, { noBorder })}>{children}</HStack>;
};
