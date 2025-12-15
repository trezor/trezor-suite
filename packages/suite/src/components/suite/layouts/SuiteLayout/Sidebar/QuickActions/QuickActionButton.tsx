import type { ReactNode } from 'react';
import React from 'react';

import styled from 'styled-components';

import type { ManagedTooltipProps } from '@trezor/components';
import { Tooltip } from '@trezor/components';

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
    tooltip?: Partial<ManagedTooltipProps>;
    'data-testid'?: string;
    isOpen?: boolean;
};

export const QuickActionButton = ({
    children,
    onClick,
    tooltip,
    'data-testid': dataTest,
    isOpen,
}: ActionButtonProps) =>
    tooltip ? (
        <Tooltip content={tooltip?.content} cursor="pointer" {...tooltip} isOpen={isOpen}>
            <Container data-testid={dataTest} onClick={onClick}>
                {children}
            </Container>
        </Tooltip>
    ) : (
        <Container data-testid={dataTest} onClick={onClick}>
            {children}
        </Container>
    );
