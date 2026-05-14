import { type JSX } from 'react';

import styled from 'styled-components';

import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { H3, Tooltip } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

// Label container to avoid jumping when tooltip appears
const FakeTooltipContainer = styled.div`
    border-bottom: 1.5px solid transparent;
`;

interface QuestionTooltipProps {
    label?: JSX.Element | ExtendedMessageDescriptor['id'];
    tooltip?: JSX.Element | ExtendedMessageDescriptor['id'];
    className?: string;
}

// TODO: remove or refactor this
export const QuestionTooltip = ({ label, tooltip, className }: QuestionTooltipProps) => (
    <Wrapper className={className}>
        {label &&
            (tooltip ? (
                <Tooltip
                    content={typeof tooltip === 'string' ? <Translation id={tooltip} /> : tooltip}
                >
                    <H3 margin={{ right: 4 }} intent="neutral" priority="secondary">
                        {typeof label === 'string' ? <Translation id={label} /> : label}
                    </H3>
                </Tooltip>
            ) : (
                <FakeTooltipContainer>
                    <H3 margin={{ right: 4 }} intent="neutral" priority="secondary">
                        {typeof label === 'string' ? <Translation id={label} /> : label}
                    </H3>
                </FakeTooltipContainer>
            ))}
    </Wrapper>
);
