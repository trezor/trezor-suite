import { MouseEventHandler } from 'react';
import styled from 'styled-components';
import { Badge } from '@trezor/components';

const StyledBadge = styled(Badge)`
    position: absolute;
    right: -9px;
    bottom: -1px;
`;

interface TokensCountProps {
    count: number;
    onClick: MouseEventHandler<HTMLButtonElement>;
}

export const TokensCount = ({ count, onClick }: TokensCountProps) => (
    <StyledBadge onClick={onClick} size="tiny" variant="neutral">
        {count}
    </StyledBadge>
);
