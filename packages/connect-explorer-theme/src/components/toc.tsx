import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef } from 'react';

import cn from 'clsx';
import scrollIntoView from 'scroll-into-view-if-needed';
import styled from 'styled-components';

import { variables } from '@trezor/components';

import { Anchor } from './anchor';
import { useActiveAnchor } from '../contexts/active-anchor';
import { useThemeConfig } from '../contexts/theme-config';
import type { TOCProps } from '../types';
import { renderComponent } from '../utils/render';

const Container = styled.div`
    ${variables.SCREEN_QUERY.ABOVE_TABLET} {
        top: var(--nextra-navbar-height);
    }
`;

const linkClassName = cn(
    '_text-xs _font-medium _text-gray-500 hover:_text-gray-900 dark:_text-gray-400 dark:hover:_text-gray-100',
    'contrast-more:_text-gray-800 contrast-more:dark:_text-gray-50',
);

export function TOC({ toc, filePath }: TOCProps): ReactElement {
    const activeAnchor = useActiveAnchor();
    const themeConfig = useThemeConfig();
    const tocRef = useRef<HTMLDivElement>(null);

    const items = useMemo(() => toc.filter(heading => heading.depth > 1), [toc]);

    const hasHeadings = items.length > 0;
    const hasMetaInfo = Boolean(
        themeConfig.feedback.content ||
        themeConfig.editLink.component ||
        themeConfig.toc.extraContent,
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
                'nextra-scrollbar _sticky _overflow-y-auto _pr-4 _pt-6 _text-sm [hyphens:auto]',
                '_max-h-[calc(100vh-var(--nextra-navbar-height)-env(safe-area-inset-bottom))] ltr:_-mr-4 rtl:_-ml-4',
            )}
        >
            {hasHeadings && (
                <>
                    <p className="_mb-4 _font-semibold _tracking-tight">
                        {renderComponent(themeConfig.toc.title)}
                    </p>
                    <ul>
                        {items.map(({ id, value, depth }) => (
                            <li className="_my-2 _scroll-my-6 _scroll-py-6" key={id}>
                                <a
                                    href={`#${id}`}
                                    className={cn(
                                        {
                                            2: '_font-semibold',
                                            3: 'ltr:_pl-4 rtl:_pr-4',
                                            4: 'ltr:_pl-8 rtl:_pr-8',
                                            5: 'ltr:_pl-12 rtl:_pr-12',
                                            6: 'ltr:_pl-16 rtl:_pr-16',
                                        }[depth as Exclude<typeof depth, 1>],
                                        '_inline-block',
                                        activeAnchor[id]?.isActive
                                            ? '_text-primary-600 _subpixel-antialiased contrast-more:!_text-primary-600'
                                            : '_text-gray-500 hover:_text-gray-900 dark:_text-gray-400 dark:hover:_text-gray-300',
                                        'contrast-more:_text-gray-900 contrast-more:_underline contrast-more:dark:_text-gray-50 _w-full _break-words',
                                    )}
                                >
                                    {value}
                                </a>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {hasMetaInfo && (
                <div
                    className={cn(
                        hasHeadings && '_mt-8 _pt-8',
                        '_sticky _bottom-0 _flex _flex-col _items-start _gap-2 _pb-8',
                    )}
                >
                    {themeConfig.feedback.content ? (
                        <Anchor
                            className={linkClassName}
                            href={themeConfig.feedback.useLink()}
                            newWindow
                        >
                            {renderComponent(themeConfig.feedback.content)}
                        </Anchor>
                    ) : null}

                    {renderComponent(themeConfig.editLink.component, {
                        filePath,
                        className: linkClassName,
                        children: renderComponent(themeConfig.editLink.content),
                    })}

                    {renderComponent(themeConfig.toc.extraContent)}

                    {renderComponent(themeConfig.toc.backToTop)}
                </div>
            )}
        </Container>
    );
}
