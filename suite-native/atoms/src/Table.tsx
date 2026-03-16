import { type ReactNode } from 'react';

import { Box } from './Box';
import { HStack } from './Stack';
import { Text } from './Text';

export type TableProps = {
    children: ReactNode;
};
type TdProps = {
    children?: ReactNode;
};

export const Td = ({ children }: TdProps) => <Box flex={1}>{children}</Box>;

export const Th = ({ children }: TdProps) => (
    <Box flex={1}>
        <Text variant="body-sm" color="textSubdued">
            {children}
        </Text>
    </Box>
);
export const Tr = ({ children }: TableProps) => (
    <HStack flexDirection="row" justifyContent="space-between" marginVertical="sp8">
        {children}
    </HStack>
);

export const Table = ({ children }: TableProps) => <Box>{children}</Box>;
