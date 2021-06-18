import React from 'react';
import styled from 'styled-components';
import { variables, Button } from '@trezor/components';
import { Translation, TrezorLink } from '@suite-components';

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
    max-width: 500px;
`;

const LearnMoreButton = styled(Button)`
    max-width: fit-content;
`;

const Description = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 12px;
    margin-top: 12px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    &:last-child {
        margin-bottom: 0px;
    }
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TextColumn = ({ title, description, learnMore }: TextColumnProps) => (
    <Wrapper>
        {title && <Title>{title}</Title>}
        {description && <Description>{description}</Description>}
        {learnMore && (
            <TrezorLink href={learnMore}>
                <LearnMoreButton variant="tertiary">
                    <Translation id="TR_LEARN_MORE" />
                </LearnMoreButton>
            </TrezorLink>
        )}
    </Wrapper>
);

export default TextColumn;
