import ReactMarkdown, { type Options } from 'react-markdown';

import styled from 'styled-components';

import { typography } from '@trezor/theme';

const StyledMarkdown = styled.div`
    ${typography['body-sm']}

    color: ${({ theme }) => theme.textSubdued};

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: ${({ theme }) => theme.textDefault};
    }

    h1 {
        margin: 8px 0 16px;
        ${typography['headline-sm']}
    }

    h2 {
        margin: 8px 0 12px;
        ${typography['body-md-strong']}
    }

    h3,
    h4,
    h5,
    h6 {
        margin: 4px 0 12px;
        ${typography['body-sm-strong']}
    }

    p,
    ul,
    ol {
        margin: 4px 0 12px;
    }

    ul,
    ol {
        padding: 0 0 0 16px;
    }

    li {
        margin: 0 0 8px;
    }

    a {
        color: ${({ theme }) => theme.textPrimaryDefault};

        &:hover {
            text-decoration: underline;
        }
    }

    img {
        max-width: 100%;
    }

    strong {
        font-weight: bold;
    }
`;

export const Markdown = (options: Readonly<Options>) => (
    <StyledMarkdown>
        <ReactMarkdown {...options}></ReactMarkdown>
    </StyledMarkdown>
);
