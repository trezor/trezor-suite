import styled from 'styled-components';
import { Tooltip, H3 } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Label = styled(H3)`
    margin-right: 4px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
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

export const QuestionTooltip = ({ label, tooltip, className }: QuestionTooltipProps) => (
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
                <FakeTooltipContainer>
                    <Label>{typeof label === 'string' ? <Translation id={label} /> : label}</Label>
                </FakeTooltipContainer>
            ))}
    </Wrapper>
);
