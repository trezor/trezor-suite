import { ReactNode } from 'react';

import { Box } from './Box';
import { HStack } from './Stack';
import { Text } from './Text';

type TableProps = {
    children: ReactNode;
};
type TdProps = {
    children?: ReactNode;
};

export const Td = ({ children }: TdProps) => <Box flex={1}>{children}</Box>;

export const Th = ({ children }: TdProps) => (
    <Box flex={1}>
        <Text variant="hint" color="textSubdued">
            {children}
        </Text>
    </Box>
);
export const Tr = ({ children }: TableProps) => (
    <HStack flexDirection="row" justifyContent="space-between" marginVertical="s">
        {children}
    </HStack>
);

export const Table = ({ children }: TableProps) => <Box>{children}</Box>;
