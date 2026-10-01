import { type ComponentType } from 'react';

import { Text, VStack } from '@suite-native/atoms';

type SendFormLayoutOptions = {
    title: string;
};

export const withSendFormLayout = (FormFields: ComponentType, options: SendFormLayoutOptions) => {
    const SendFormWithLayout = () => (
        <VStack spacing={24} padding="sp16">
            <VStack spacing={8}>
                <Text variant="headline-md">{options.title}</Text>
                <Text color="contentSecondary">Synthetic send form with example fees</Text>
            </VStack>
            <FormFields />
        </VStack>
    );

    return SendFormWithLayout;
};
