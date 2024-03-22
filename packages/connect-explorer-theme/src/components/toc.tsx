import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef } from 'react';

import cn from 'clsx';
import type { Heading } from 'nextra';
import scrollIntoView from 'scroll-into-view-if-needed';
import styled from 'styled-components';

import { variables } from '@trezor/components';

import { useActiveAnchor, useConfig } from '../contexts';
import { renderComponent } from '../utils';
import { Anchor } from './anchor';
import { BackToTop } from './back-to-top';

export type TOCProps = {
    headings: Heading[];
    filePath: string;
};

const Container = styled.div`
    ${variables.SCREEN_QUERY.ABOVE_TABLET} {
        top: var(--nextra-navbar-height);
    }
`;

const linkClassName = cn(
    'nx-text-xs nx-font-medium nx-text-gray-500 hover:nx-text-gray-900 dark:nx-text-gray-400 dark:hover:nx-text-gray-100',
    'contrast-more:nx-text-gray-800 contrast-more:dark:nx-text-gray-50',
);

export function TOC({ headings, filePath }: TOCProps): ReactElement {
    const activeAnchor = useActiveAnchor();
    const config = useConfig();
    const tocRef = useRef<HTMLDivElement>(null);

    const items = useMemo(() => headings.filter(heading => heading.depth > 1), [headings]);

    const hasHeadings = items.length > 0;
    const hasMetaInfo = Boolean(
        config.feedback.content || config.editLink.component || config.toc.extraContent,
    );

    const activeSlug = Object.entries(activeAnchor).find(([, { isActive }]) => isActive)?.[0];

    useEffect(() => {
        if (!activeSlug) return;
        const anchor = tocRef.current?.querySelector(`li > a[href="#${activeSlug}"]`);

        if (anchor) {
            scrollIntoView(anchor, {
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
                scrollMode: 'always',
                boundary: tocRef.current,
            });
        }
    }, [activeSlug]);

    return (
        <Container
            ref={tocRef}
            className={cn(
                'nextra-scrollbar nx-sticky nx-overflow-y-auto nx-pr-4 nx-pt-6 nx-text-sm [hyphens:auto]',
                'nx-max-h-[calc(100vh-var(--nextra-navbar-height)-env(safe-area-inset-bottom))] ltr:-nx-mr-4 rtl:-nx-ml-4',
            )}
        >
            {hasHeadings && (
                <>
                    <p className="nx-mb-4 nx-font-semibold nx-tracking-tight">
                        {renderComponent(config.toc.title)}
                    </p>
                    <ul>
                        {items.map(({ id, value, depth }) => (
                            <li className="nx-my-2 nx-scroll-my-6 nx-scroll-py-6" key={id}>
                                <a
                                    href={`#${id}`}
                                    className={cn(
                                        {
                                            2: 'nx-font-semibold',
                                            3: 'ltr:nx-pl-4 rtl:nx-pr-4',
                                            4: 'ltr:nx-pl-8 rtl:nx-pr-8',
                                            5: 'ltr:nx-pl-12 rtl:nx-pr-12',
                                            6: 'ltr:nx-pl-16 rtl:nx-pr-16',
                                        }[depth as Exclude<typeof depth, 1>],
                                        'nx-inline-block',
                                        activeAnchor[id]?.isActive
                                            ? 'nx-text-primary-600 nx-subpixel-antialiased contrast-more:!nx-text-primary-600'
                                            : 'nx-text-gray-500 hover:nx-text-gray-900 dark:nx-text-gray-400 dark:hover:nx-text-gray-300',
                                        'contrast-more:nx-text-gray-900 contrast-more:nx-underline contrast-more:dark:nx-text-gray-50 nx-w-full nx-break-words',
                                    )}
                                >
                                    {config.toc.headingComponent?.({
                                        id,
                                        children: value,
                                    }) ?? value}
                                </a>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {hasMetaInfo && (
                <div
                    className={cn(
                        hasHeadings && 'nx-mt-8 nx-pt-8',
                        'nx-sticky nx-bottom-0 nx-flex nx-flex-col nx-items-start nx-gap-2 nx-pb-8',
                    )}
                >
                    {config.feedback.content ? (
                        <Anchor
                            className={linkClassName}
                            href={config.feedback.useLink()}
                            newWindow
                        >
                            {renderComponent(config.feedback.content)}
                        </Anchor>
                    ) : null}

                    {renderComponent(config.editLink.component, {
                        filePath,
                        className: linkClassName,
                        children: renderComponent(config.editLink.text),
                    })}

                    {renderComponent(config.toc.extraContent)}

                    {config.toc.backToTop && <BackToTop className={linkClassName} />}
                </div>
            )}
        </Container>
    );
}
