import ReactMarkdown, { Options } from 'react-markdown';

import styled from 'styled-components';

import { typography } from '@trezor/theme';

const StyledMarkdown = styled.div`
    ${typography.hint}

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
        ${typography.titleSmall}
    }

    h2 {
        margin: 8px 0 12px;
        ${typography.highlight}
    }

    h3,
    h4,
    h5,
    h6 {
        margin: 4px 0 12px;
        ${typography.callout}
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
