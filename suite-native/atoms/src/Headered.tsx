import { ReactNode } from 'react';

import { G } from '@mobily/ts-belt';

import { VStack } from './Stack';
import { Text } from './Text';
import { Box } from './Box';

type HeaderedProps = {
    header: ReactNode;
    children: ReactNode;
};

type HeaderContainerProps = { children: ReactNode };

const HeaderContainer = ({ children }: HeaderContainerProps) => (
    <Box paddingHorizontal="m">{G.isString(children) ? <Text>{children}</Text> : children}</Box>
);

/**
 * Adds a header to child component with app-wide padding styles.
 */
export const Headered = ({ children, header }: HeaderedProps) => (
    <VStack spacing="m">
        <HeaderContainer>{header}</HeaderContainer>
        {children}
    </VStack>
);
