import { ReactNode } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { Url } from '@trezor/urls';

import { LearnMoreButton } from '../LearnMoreButton';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    text-align: left;
    margin-right: 16px;
    max-width: 500px;
`;

const Description = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-bottom: 12px;
    margin-top: 12px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    :first-child {
        margin-top: 0;
    }

    :last-child {
        margin-bottom: 0;
    }
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface TextColumnProps {
    title?: ReactNode;
    description?: ReactNode;
    buttonLink?: Url;
    buttonTitle?: ReactNode;
}

export const TextColumn = ({ title, description, buttonLink, buttonTitle }: TextColumnProps) => (
    <Wrapper>
        {title && <Title>{title}</Title>}
        {description && <Description>{description}</Description>}
        {buttonLink && <LearnMoreButton url={buttonLink}>{buttonTitle}</LearnMoreButton>}
    </Wrapper>
);
