import { ReactNode } from 'react';

import { VStack, Text } from '@suite-native/atoms';

import { PassphraseScreenWrapper } from './PassphraseScreenWrapper';

type PassphraseContentScreenWrapperProps = {
    children: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    footer?: ReactNode;
};

export const PassphraseContentScreenWrapper = ({
    children,
    title,
    subtitle,
    footer,
}: PassphraseContentScreenWrapperProps) => {
    return (
        <PassphraseScreenWrapper footer={footer}>
            <VStack spacing="large" flex={1}>
                <VStack>
                    <Text variant="titleMedium">{title}</Text>
                    {subtitle && <Text>{subtitle}</Text>}
                </VStack>
                {children}
            </VStack>
        </PassphraseScreenWrapper>
    );
};
