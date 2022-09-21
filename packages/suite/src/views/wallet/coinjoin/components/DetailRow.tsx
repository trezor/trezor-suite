import React from 'react';
import styled from 'styled-components';

import { Icon, Tooltip, variables } from '@trezor/components';

const Row = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    justify-content: space-between;
    margin-top: 8px;
`;

const Key = styled.dt`
    align-items: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Value = styled.dd`
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const StyledIcon = styled(Icon)`
    margin-left: 6px;
`;

interface DetailRowProps {
    term: React.ReactNode;
    tooltip?: React.ReactNode;
    value: React.ReactNode;
}

export const DetailRow = ({ term, tooltip, value }: DetailRowProps) => (
    <Row>
        <Key>
            {term}
            {!!tooltip && (
                <Tooltip interactive={false} content={tooltip}>
                    <StyledIcon icon="INFO" size={14} />
                </Tooltip>
            )}
        </Key>
        <Value>{value}</Value>
    </Row>
);
