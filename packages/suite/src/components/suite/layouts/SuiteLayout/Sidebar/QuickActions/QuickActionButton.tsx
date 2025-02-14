import React, { ReactNode } from 'react';

import styled from 'styled-components';

import { ManagedTooltipProps, Tooltip } from '@trezor/components';

const Container = styled.div`
    height: 44px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
`;

type ActionButtonProps = {
    onClick?: () => void;
    children: ReactNode;
    tooltip: Partial<ManagedTooltipProps>;
    'data-testid'?: string;
    isOpen?: boolean;
};

export const QuickActionButton = ({
    children,
    onClick,
    tooltip,
    'data-testid': dataTest,
    isOpen,
}: ActionButtonProps) => (
    <Tooltip content={tooltip?.content} cursor="pointer" {...tooltip} isOpen={isOpen}>
        <Container data-testid={dataTest} onClick={onClick}>
            {children}
        </Container>
    </Tooltip>
);
