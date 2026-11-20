import { type ReactNode } from 'react';

import { Text } from '@trezor/components';

type WrappingSingleValueProps = {
    children?: ReactNode;
};

export const WrappingSingleValue = ({ children }: WrappingSingleValueProps) => (
    <Text as="div" maxWidth="100%" intent="neutral" priority="primary" padding={{ vertical: 8 }}>
        {children}
    </Text>
);
