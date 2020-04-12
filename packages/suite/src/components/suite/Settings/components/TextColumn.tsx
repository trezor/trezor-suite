import React from 'react';
import styled from 'styled-components';
import { Link, colors, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';

interface TextColumnProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    learnMore?: string;
}

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;
    margin-right: 16px;
`;

const Description = styled.div`
    color: ${colors.BLACK50};
    margin: 12px 0;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const LearnMoreWrapper = styled(Link)`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK17};
`;

const LearnMore = ({ href, ...props }: { href: string }) => (
    <LearnMoreWrapper href={href} {...props}>
        <Translation id="TR_LEARN_MORE_LINK" />
    </LearnMoreWrapper>
);

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const TextColumn = ({ title, description, learnMore }: TextColumnProps) => {
    return (
        <Wrapper>
            <Title>{title}</Title>
            {description && <Description>{description}</Description>}
            {learnMore && <LearnMore href={learnMore} />}
        </Wrapper>
    );
};

export default TextColumn;
