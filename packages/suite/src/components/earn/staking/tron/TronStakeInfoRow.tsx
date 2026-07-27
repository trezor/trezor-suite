import { type ReactNode } from 'react';

import { Row, Text } from '@trezor/components';

interface TronStakeInfoRowProps {
    label: ReactNode;
    children: ReactNode;
}

export const TronStakeInfoRow = ({ label, children }: TronStakeInfoRowProps) => (
    <Row
        justifyContent="space-between"
        alignItems="center"
        padding={{ vertical: 16, horizontal: 20 }}
    >
        <Text typographyStyle="body-md">{label}</Text>
        {children}
    </Row>
);
