import { type ReactNode } from 'react';

import { Card, Column } from '@trezor/components';

type FormCardProps = {
    children: ReactNode;
};

export const FormCard = ({ children }: FormCardProps) => (
    <Card paddingType="none">
        <Column hasDivider>{children}</Column>
    </Card>
);
