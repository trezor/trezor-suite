import { ReactNode } from 'react';

import { Box, SwipeableWalkthroughStepHeader } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type WalletRecapStepContentProps = {
    title?: ReactNode;
    callout?: ReactNode;
    children?: ReactNode;
};

const innerContainerStyle = prepareNativeStyle(utils => ({
    bottom: utils.spacings.sp16,
}));

export const WalletRecapStepContent = ({
    title,
    callout,
    children,
}: WalletRecapStepContentProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box
            flex={1}
            alignItems="center"
            justifyContent="center"
            style={applyStyle(innerContainerStyle)}
        >
            {children || <SwipeableWalkthroughStepHeader callout={callout} title={title} />}
        </Box>
    );
};
