import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Label = styled.div`
    margin-right: 4px;
`;

interface Props {
    label?: JSX.Element | ExtendedMessageDescriptor['id'];
    tooltip?: JSX.Element | ExtendedMessageDescriptor['id'];
    className?: string;
}

export const QuestionTooltip = ({ label, tooltip, className }: Props) => (
    <Wrapper className={className}>
        {label &&
            (tooltip ? (
                <Tooltip
                    content={typeof tooltip === 'string' ? <Translation id={tooltip} /> : tooltip}
                    dashed
                >
                    <Label>{typeof label === 'string' ? <Translation id={label} /> : label}</Label>
                </Tooltip>
            ) : (
                <Label>{typeof label === 'string' ? <Translation id={label} /> : label}</Label>
            ))}
    </Wrapper>
);

export default QuestionTooltip;
