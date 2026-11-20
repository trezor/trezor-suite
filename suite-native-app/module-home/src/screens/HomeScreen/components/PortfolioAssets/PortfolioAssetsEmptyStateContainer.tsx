import { type ReactNode } from 'react';

import { VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

// The design keeps every asset list empty state at least this tall.
const MIN_HEIGHT = 329;

const containerStyle = prepareNativeStyle(_ => ({
    minHeight: MIN_HEIGHT,
}));

type PortfolioAssetsEmptyStateContainerProps = {
    children: ReactNode;
    testID?: string;
};

export const PortfolioAssetsEmptyStateContainer = ({
    children,
    testID,
}: PortfolioAssetsEmptyStateContainerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack
            spacing="sp20"
            alignItems="center"
            justifyContent="center"
            padding="sp24"
            style={applyStyle(containerStyle)}
            testID={testID}
        >
            {children}
        </VStack>
    );
};
