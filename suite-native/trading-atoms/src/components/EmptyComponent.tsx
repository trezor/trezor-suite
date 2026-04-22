import { type ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type TradingEmptyComponentProps = {
    title: ReactNode;
    description: ReactNode;
};

const emptyComponentStyle = prepareNativeStyle(({ spacings }) => ({
    padding: spacings.sp52,
    alignContent: 'center',
    justifyContent: 'center',
    gap: spacings.sp12,
}));

export const EmptyComponent = ({ title, description }: TradingEmptyComponentProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack style={applyStyle(emptyComponentStyle)}>
            <Text variant="body-md" color="contentPrimary" textAlign="center">
                {title}
            </Text>
            <Text variant="body-sm" color="contentSecondary" textAlign="center">
                {description}
            </Text>
        </VStack>
    );
};
