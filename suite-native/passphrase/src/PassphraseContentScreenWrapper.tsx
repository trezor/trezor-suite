import { ReactNode } from 'react';

import { TitleHeader, VStack } from '@suite-native/atoms';
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
    <Screen header={<PassphraseScreenHeader />}>
        <VStack marginTop="sp8" spacing="sp16">
            <TitleHeader title={title} subtitle={subtitle} titleVariant="titleMedium" />
            {children}
        </VStack>
    </Screen>
);
