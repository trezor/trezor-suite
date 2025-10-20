import { ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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
            <Text variant="body" color="textDefault" textAlign="center">
                {title}
            </Text>
            <Text variant="hint" color="textSubdued" textAlign="center">
                {description}
            </Text>
        </VStack>
    );
};
