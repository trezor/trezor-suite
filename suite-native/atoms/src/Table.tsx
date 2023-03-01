import React, { ReactNode } from 'react';

import { Box } from './Box';
import { Text } from './Text';

type TableProps = {
    children: ReactNode;
};
type TdProps = {
    children?: ReactNode;
};

export const Td = ({ children }: TdProps) => (
    <Box flex={1}>
        <Text variant="hint">{children}</Text>
    </Box>
);

export const Th = ({ children }: TdProps) => (
    <Box flex={1}>
        <Text variant="hint" color="textSubdued">
            {children}
        </Text>
    </Box>
);
export const Tr = ({ children }: TableProps) => (
    <Box flexDirection="row" justifyContent="space-between" marginVertical="small">
        {children}
    </Box>
);

export const Table = ({ children }: TableProps) => <Box>{children}</Box>;
