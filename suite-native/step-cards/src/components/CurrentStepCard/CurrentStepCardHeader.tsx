import { type ReactNode } from 'react';

import { VStack } from '@suite-native/atoms';

type CurrentStepCardHeaderProps = { children: ReactNode };

export const CurrentStepCardHeader = ({ children }: CurrentStepCardHeaderProps) => (
    <VStack paddingHorizontal="sp16" paddingBottom="sp16" spacing="sp8">
        {children}
    </VStack>
);
