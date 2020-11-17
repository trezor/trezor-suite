import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation, ExternalLink } from '@suite-components';

interface TextColumnProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    learnMore?: string;
}

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    text-align: left;
    margin-right: 16px;
`;

const Description = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 12px;
    font-size: ${variables.FONT_SIZE.TINY};

    &:last-child {
        margin-bottom: 0px;
    }
`;

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
    margin-bottom: 12px;
`;

const TextColumn = ({ title, description, learnMore }: TextColumnProps) => {
    return (
        <Wrapper>
            {title && <Title>{title}</Title>}
            {description && <Description>{description}</Description>}
            {learnMore && (
                <ExternalLink href={learnMore} size="tiny">
                    <Translation id="TR_LEARN_MORE" />
                </ExternalLink>
            )}
        </Wrapper>
    );
};

export default TextColumn;
