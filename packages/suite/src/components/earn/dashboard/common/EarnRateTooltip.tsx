import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Tooltip } from '@trezor/components';

const Abbr = styled.abbr`
    cursor: help;
    text-decoration: underline dotted ${({ theme }) => theme.contentSecondary};
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
`;

type EarnRateTooltipProps = {
    children: ReactNode;
    content: ReactNode;
    tooltipMaxWidth?: number;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    'data-testid'?: string;
};

export const EarnRateTooltip = ({
    children,
    content,
    tooltipMaxWidth = 600,
    onMouseEnter,
    onMouseLeave,
    'data-testid': dataTestId,
}: EarnRateTooltipProps) => (
    <Tooltip as="span" display="inline-flex" content={content} tooltipMaxWidth={tooltipMaxWidth}>
        <Abbr data-testid={dataTestId} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {children}
        </Abbr>
    </Tooltip>
);
