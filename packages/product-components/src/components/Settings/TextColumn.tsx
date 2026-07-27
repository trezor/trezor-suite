import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Paragraph } from '@trezor/components';
import { typography } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    text-align: left;
    margin-right: 16px;
    max-width: 500px;
`;

const Description = styled.div`
    color: ${({ theme }) => theme.contentSecondary};
    margin-bottom: 12px;
    margin-top: 12px;
    ${typography['body-sm']}

    &:first-child {
        margin-top: 0;
    }

    &:last-child {
        margin-bottom: 0;
    }
`;

interface TextColumnProps {
    title?: ReactNode;
    description?: ReactNode;
    bottomContent?: ReactNode;
    'data-testid'?: string;
}

export const TextColumn = ({
    title,
    description,
    bottomContent,
    'data-testid': dataTestId,
}: TextColumnProps) => (
    <Wrapper data-test={dataTestId}>
        {title && <Paragraph typographyStyle="body-md">{title}</Paragraph>}
        {description && <Description>{description}</Description>}
        {bottomContent}
    </Wrapper>
);
