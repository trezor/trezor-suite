import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Card, Icon } from '@trezor/components';

interface BatchWrapperProps {
    children: ReactNode;
    onRemove: () => void;
}

const Fields = styled.div`
    flex: 1;
`;

export const BatchWrapper = ({ children, onRemove }: BatchWrapperProps) => (
    <Card paddingType="small">
        <Icon name="x" onClick={() => onRemove()} size={20} />
        <Fields>{children}</Fields>
    </Card>
);
