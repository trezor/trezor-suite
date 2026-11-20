import {
    type ComponentType,
    type LazyExoticComponent,
    Suspense,
    lazy,
    useEffect,
    useState,
} from 'react';
import type { Options } from 'react-markdown';

import styled from 'styled-components';

import { typography } from '@trezor/theme';

const PlainText = styled.p`
    white-space: pre-wrap;
`;

/**
 * Lazy load because `react-markdown` pulls in the whole unified/remark/micromark parser,
 * which only articles, release notes and changelogs need.
 * A failed chunk load shows the source as plain text instead of crashing the app.
 * Each Markdown keeps the component it mounted with, so its re-renders never download again,
 * and the plain text re-arms the loader once it has committed, so the next mount tries once more.
 */
let ReactMarkdown: LazyExoticComponent<ComponentType<Readonly<Options>>>;

const loadReactMarkdown = (): Promise<{ default: ComponentType<Readonly<Options>> }> =>
    import(/* webpackExports: ['default'] */ 'react-markdown').catch(() => {
        const failedReactMarkdown = ReactMarkdown;

        const PlainTextMarkdown = ({ children }: Readonly<Options>) => {
            /**
             * Re-armed after the commit, not in the loader: React renders a tree that has not
             * committed yet again once the load settles, and a fresh lazy there downloads again.
             */
            useEffect(() => {
                if (ReactMarkdown === failedReactMarkdown) {
                    ReactMarkdown = lazy(loadReactMarkdown);
                }
            }, []);

            return <PlainText>{children}</PlainText>;
        };

        return { default: PlainTextMarkdown };
    });

ReactMarkdown = lazy(loadReactMarkdown);

const StyledMarkdown = styled.div`
    ${typography['body-sm']}

    color: currentcolor;

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: currentcolor;
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
        padding: 0 0 0 24px;
    }

    li {
        margin: 0 0 8px;
    }

    a {
        color: ${({ theme }) => theme.contentBrand};

        &:hover {
            text-decoration: underline;
        }
    }

    section[data-testid='guide-banner'] {
        p {
            margin: 0;
        }

        a {
            color: inherit;
        }
    }

    img {
        max-width: 100%;
    }

    strong {
        font-weight: bold;
    }
`;

export const Markdown = (options: Readonly<Options>) => {
    const [MountedReactMarkdown] = useState(() => ReactMarkdown);

    return (
        <StyledMarkdown data-component="Markdown">
            <Suspense fallback={null}>
                <MountedReactMarkdown {...options} />
            </Suspense>
        </StyledMarkdown>
    );
};
