import { ReactNode } from 'react';

import { VStack, Text } from '@suite-native/atoms';

import { PassphraseScreenWrapper } from './PassphraseScreenWrapper';

type PassphraseContentScreenWrapperProps = {
    children: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
};

export const PassphraseContentScreenWrapper = ({
    children,
    title,
    subtitle,
}: PassphraseContentScreenWrapperProps) => {
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
