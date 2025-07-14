import { Children, ReactNode } from 'react';

import { A, G } from '@mobily/ts-belt';

import { Text, VStack } from '@suite-native/atoms';

type TitledSectionProps = {
    title: ReactNode;
    children: ReactNode;
};

export const TitledSection = ({ title, children }: TitledSectionProps) => {
    // If children elements are conditionally rendered and section would end up being empty, avoid rendering the whole section.
    const validChildren = Children.toArray(children).filter(child => G.isNotNullable(child));

    if (A.isEmpty(validChildren)) {
        return null;
    }

    return (
        <VStack spacing="sp16">
            <Text variant="titleSmall" color="textOnTertiary">
                {title}
            </Text>
            <VStack spacing="sp12">{children}</VStack>
        </VStack>
    );
};
