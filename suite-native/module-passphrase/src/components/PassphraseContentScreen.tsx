import { ReactNode } from 'react';

import { VStack, Text } from '@suite-native/atoms';

import { PassphraseScreenWrapper } from './PassphraseScreen';

type PassphraseContentScreenProps = {
    children: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
};

export const PassphraseContentScreen = ({
    children,
    title,
    subtitle,
}: PassphraseContentScreenProps) => {
    return (
        <PassphraseScreenWrapper>
            <VStack spacing="large">
                <VStack>
                    <Text variant="titleMedium">{title}</Text>
                    {subtitle && <Text>{subtitle}</Text>}
                </VStack>
                {children}
            </VStack>
        </PassphraseScreenWrapper>
    );
};
