import React from 'react';
import styled from 'styled-components';

import { ExtendedMessageDescriptor } from '@suite-types';
import { variables } from '@trezor/components';
import { TooltipIcon } from './TooltipIcon';

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

interface DetailRowProps {
    term: React.ReactNode;
    tooltipMessage?: ExtendedMessageDescriptor['id'];
    value: React.ReactNode;
}

export const DetailRow = ({ term, tooltipMessage, value }: DetailRowProps) => (
    <Row>
        <Key>
            {term}
            {!!tooltipMessage && <TooltipIcon message={tooltipMessage} />}
        </Key>
        <Value>{value}</Value>
    </Row>
);
