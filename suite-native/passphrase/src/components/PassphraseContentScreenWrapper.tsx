import { type ReactNode } from 'react';

import { TitleHeader, VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

type PassphraseContentScreenWrapperProps = {
    children: ReactNode;
    header: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
};

export const PassphraseContentScreenWrapper = ({
    children,
    header,
    title,
    subtitle,
}: PassphraseContentScreenWrapperProps) => (
    <Screen header={header}>
        <VStack marginTop="sp8" spacing="sp16">
            <TitleHeader title={title} subtitle={subtitle} titleVariant="headline-md" />
            {children}
        </VStack>
    </Screen>
);
