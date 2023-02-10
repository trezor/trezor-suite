import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation, TranslationKey } from '@suite-components/Translation';

const HeadingCointainer = styled.div`
    margin: -6px 0 0 10px;
`;

const Heading = styled.p<{ $color?: string }>`
    margin-bottom: 4px;
    color: ${({ theme, color }) => color || theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const SubHeading = styled.p`
    max-width: 480px;
    margin-top: 6px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.H3};
`;

interface SummaryMessageProps {
    headingId: TranslationKey;
    messageId: TranslationKey;
    headingColor?: string;
}

export const SummaryMessage = ({ headingId, messageId, headingColor }: SummaryMessageProps) => (
    <HeadingCointainer>
        <Heading color={headingColor}>
            <Translation id={headingId} />
        </Heading>
        <SubHeading>
            <Translation id={messageId} />
        </SubHeading>
    </HeadingCointainer>
);
