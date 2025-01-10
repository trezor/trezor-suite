import { ReactNode } from 'react';

import { VStack, Text } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

import { PassphraseScreenHeader } from './PassphraseScreenHeader';

type PassphraseContentScreenWrapperProps = {
    children: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
};

export const PassphraseContentScreenWrapper = ({
    children,
    title,
    subtitle,
}: PassphraseContentScreenWrapperProps) => (
    <Screen screenHeader={<PassphraseScreenHeader />}>
        <VStack marginTop="sp8" spacing="sp16">
            <VStack>
                <Text variant="titleMedium">{title}</Text>
                {subtitle && <Text>{subtitle}</Text>}
            </VStack>
            {children}
        </VStack>
    </Screen>
);
