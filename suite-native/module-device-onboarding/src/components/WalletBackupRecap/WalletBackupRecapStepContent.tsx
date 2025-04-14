import { ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SwipeableWalkthroughStepHeader } from '../SwipeableWalkthrough/SwipeableWalkthroughStepHeader';

type WalletBackupRecapStepContentProps = {
    title?: ReactNode;
    callout?: ReactNode;
    children?: ReactNode;
};

const innerContainerStyle = prepareNativeStyle(utils => ({
    bottom: utils.spacings.sp16,
}));

export const WalletBackupRecapStepContent = ({
    title,
    callout,
    children,
}: WalletBackupRecapStepContentProps) => {
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
