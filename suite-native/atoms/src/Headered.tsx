import { ReactNode } from 'react';

import { G } from '@mobily/ts-belt';

import { Box } from './Box';
import { VStack } from './Stack';
import { Text } from './Text';

type HeaderedProps = {
    header: ReactNode;
    children: ReactNode;
};

type HeaderContainerProps = { children: ReactNode };

const HeaderContainer = ({ children }: HeaderContainerProps) => (
    <Box paddingHorizontal="sp16">{G.isString(children) ? <Text>{children}</Text> : children}</Box>
);

/**
 * Adds a header to child component with app-wide padding styles.
 */
export const Headered = ({ children, header }: HeaderedProps) => (
    <VStack spacing="sp16">
        <HeaderContainer>{header}</HeaderContainer>
        {children}
    </VStack>
);
