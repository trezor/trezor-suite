import styled from 'styled-components';

import ReactMarkdown, { Options } from 'react-markdown';
import { variables } from '../../config';

const StyledMarkdown = styled.div`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.5;
    padding: 0 0 32px;

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    }

    h1 {
        margin: 8px 0 16px;
        font-size: ${variables.FONT_SIZE.BIG};
    }

    h2 {
        margin-bottom: 8px 0 12px;
        font-size: ${variables.FONT_SIZE.NORMAL};
    }

    h3,
    h4,
    h5,
    h6 {
        margin: 4px 0 12px;
        font-size: ${variables.FONT_SIZE.SMALL};
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
        color: ${({ theme }) => theme.legacy.TYPE_GREEN};

        &:hover {
            text-decoration: underline;
        }
    }

    img {
        max-width: 100%;
    }

    strong {
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    }
`;

export const Markdown = (options: Readonly<Options>) => {
    return (
        <StyledMarkdown>
            <ReactMarkdown {...options}></ReactMarkdown>
        </StyledMarkdown>
    );
};
