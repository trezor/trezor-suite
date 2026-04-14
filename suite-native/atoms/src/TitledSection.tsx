import { Children, type ReactNode } from 'react';

import { A } from '@mobily/ts-belt';

import { isNotNullOrUndefined } from '@trezor/utils';

import { VStack } from './Stack';
import { Text } from './Text';

type TitledSectionProps = {
    title: ReactNode;
    children: ReactNode;
};

export const TitledSection = ({ title, children }: TitledSectionProps) => {
    // If children elements are conditionally rendered and section would end up being empty, avoid rendering the whole section.
    const validChildren = Children.toArray(children).filter(child => isNotNullOrUndefined(child));

    if (A.isEmpty(validChildren)) {
        return null;
    }

    return (
        <VStack spacing="sp16">
            <Text variant="headline-sm" color="contentNeutral">
                {title}
            </Text>
            <VStack spacing="sp12">{children}</VStack>
        </VStack>
    );
};
