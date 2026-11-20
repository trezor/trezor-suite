import { type ReactNode } from 'react';

import { Spinner, Text, VStack } from '@suite-native/atoms';

type ConnectLoaderProps = {
    title?: ReactNode;
};

export const ConnectLoader = ({ title }: ConnectLoaderProps) => (
    <VStack spacing="sp16" alignItems="center">
        <Spinner loadingState="idle" />
        {title && (
            <Text variant="body-sm" color="contentSecondary" textAlign="center">
                {title}
            </Text>
        )}
    </VStack>
);
