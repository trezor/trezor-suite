import React, { ReactNode } from 'react';

import styled from 'styled-components';

import { Tooltip } from '@trezor/components';

const Container = styled.div`
    height: 44px;
    flex: 1;

    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;
`;

type ActionButtonProps = {
    onClick?: () => void;
    children: ReactNode;
    tooltip: ReactNode;
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
    <Tooltip placement="right" hasArrow content={tooltip} cursor="pointer" isOpen={isOpen}>
        <Container data-testid={dataTest} onClick={onClick}>
            {children}
        </Container>
    </Tooltip>
);
