import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Tooltip } from '@trezor/components';

import { RelativeTime } from '../RelativeTime/RelativeTime';

const LastUpdate = styled.div`
    text-transform: none;
`;

type LastUpdateTooltipProps = {
    timestamp: number;
    children: ReactNode;
    renderTooltipContent: (relativeTime: ReactNode) => ReactNode;
};

export const LastUpdateTooltip = ({
    timestamp,
    children,
    renderTooltipContent,
}: LastUpdateTooltipProps) => (
    <Tooltip
        maxWidth={285}
        placement="top"
        content={
            <LastUpdate>{renderTooltipContent(<RelativeTime timestamp={timestamp} />)}</LastUpdate>
        }
    >
        {children}
    </Tooltip>
);
