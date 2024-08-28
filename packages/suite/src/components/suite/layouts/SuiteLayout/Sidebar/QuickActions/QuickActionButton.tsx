import React, { ReactNode } from 'react';
import { Tooltip } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${spacingsPx.xs} ${spacingsPx.md};
    cursor: pointer;
`;

type ActionButtonProps = {
    onClick?: () => void;
    children: ReactNode;
    tooltip: ReactNode;
    'data-testid'?: string;
};

export const QuickActionButton = ({
    children,
    onClick,
    tooltip,
    'data-testid': dataTest,
}: ActionButtonProps) => (
    <Tooltip content={tooltip} cursor="pointer">
        <Container data-testid={dataTest} onClick={onClick}>
            {children}
        </Container>
    </Tooltip>
);
