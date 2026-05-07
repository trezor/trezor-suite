/* eslint-disable @typescript-eslint/no-use-before-define */
import type { ComponentProps, HTMLProps, PropsWithChildren, ReactElement, ReactNode } from 'react';
import { Children, cloneElement, useEffect, useRef, useState } from 'react';

import cn from 'clsx';
import type { Heading } from 'nextra';
import { Code, Pre, Table, Td, Th, Tr } from 'nextra/components';
import { useMounted } from 'nextra/hooks';
import type { MDXComponents } from 'nextra/mdx';

import { Card } from '@trezor/components';

import { Anchor, Breadcrumb, Collapse, NavLinks, Sidebar, SkipNavContent } from './components';
import type { AnchorProps } from './components/anchor';
import { useIntersectionObserver, useSetActiveAnchor, useSlugs } from './contexts/active-anchor';
import { DetailsProvider, useDetails } from './contexts/details';
import { useThemeConfig } from './contexts/theme-config';
import { useConfig } from './contexts/useConfig';
import type { DocsThemeConfig } from './schema';
import { renderComponent } from './utils/render';

// Anchor links
function HeadingLink({
    tag: Tag,
    context,
    children,
    id,
    className,
    ...props
}: ComponentProps<'h2'> & {
    tag: `h${2 | 3 | 4 | 5 | 6}`;
    context: { index: number };
}): ReactElement {
    const setActiveAnchor = useSetActiveAnchor();
    const slugs = useSlugs();
    const observer = useIntersectionObserver();
    const obRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (!id) return;
        const heading = obRef.current;
        if (!heading) return;
        // eslint-disable-next-line react-hooks/immutability
        slugs.set(heading, [id, (context.index += 1)]);
        observer?.observe(heading);

        return () => {
            observer?.disconnect();
            slugs.delete(heading);
            setActiveAnchor(f => {
                const ret = { ...f };
                delete ret[id];

                return ret;
            });
        };
    }, [id, context, slugs, observer, setActiveAnchor]);

    return (
        <Tag
            className={
                // can be added by footnotes
                className === 'sr-only'
                    ? '_sr-only'
                    : cn(
                          '_font-semibold _tracking-tight _text-slate-900 dark:_text-slate-100 first:_mt-0 _mb-[-4]',
                          {
                              h2: '_mt-8 _text-3xl',
                              h3: '_mt-6 _text-2xl',
                              h4: '_mt-6 _text-xl',
                              h5: '_mt-6 _text-lg',
                              h6: '_mt-6 _text-base',
                          }[Tag],
                      )
            }
            {...props}
        >
            {children}
            {id && (
                <a
                    href={`#${id}`}
                    id={id}
                    className="subheading-anchor"
                    aria-label="Permalink for this section"
                    ref={obRef}
                />
            )}
        </Tag>
    );
}

const findSummary = (children: ReactNode) => {
    let summary: ReactNode = null;
    const restChildren: ReactNode[] = [];

    Children.forEach(children, (child, index) => {
        if (child && (child as ReactElement).type === Summary) {
            summary ||= child;

            return;
        }

        let c = child;
        if (
            !summary &&
            child &&
            typeof child === 'object' &&
            (child as ReactElement).type !== Details &&
            'props' in child &&
            child.props
        ) {
            const result = findSummary((child.props as PropsWithChildren).children);
            summary = result[0];
            c = cloneElement(child, {
                ...child.props,
                children: result[1]?.length ? result[1] : undefined,
                key: index,
            } as HTMLProps<Element>);
        }
        restChildren.push(c);
    });

    return [summary, restChildren];
};

const Details = ({ children, open, ...props }: ComponentProps<'details'>): ReactElement => {
    const [openState, setOpen] = useState(!!open);
    const [summary, restChildren] = findSummary(children);

    // To animate the close animation we have to delay the DOM node state here.
    const [delayedOpenState, setDelayedOpenState] = useState(openState);
    useEffect(() => {
        if (openState) {
            setDelayedOpenState(true);
        } else {
            const timeout = setTimeout(() => setDelayedOpenState(openState), 500);

            return () => clearTimeout(timeout);
        }
    }, [openState]);

    return (
        <details
            className="_my-4 _rounded _border _border-gray-200 _bg-white _p-2 _shadow-sm first:_mt-0 dark:_border-neutral-800 dark:_bg-neutral-900"
            {...props}
            open={delayedOpenState}
            {...(openState && { 'data-expanded': true })}
        >
            <DetailsProvider value={setOpen}>{summary}</DetailsProvider>
            <Collapse isOpen={openState}>{restChildren}</Collapse>
        </details>
    );
};

const Summary = (props: ComponentProps<'summary'>): ReactElement => {
    const setOpen = useDetails();

    return (
        <summary
            className={cn(
                '_flex _items-center _cursor-pointer _list-none _p-1 _transition-colors hover:_bg-gray-100 dark:hover:_bg-neutral-800',
                "before:_mr-1 before:_inline-block before:_transition-transform before:_content-[''] dark:before:_invert before:_shrink-0",
                'rtl:before:_rotate-180 [[data-expanded]>&]:before:_rotate-90',
            )}
            {...props}
            onClick={e => {
                e.preventDefault();
                setOpen(v => !v);
            }}
        />
    );
};

const EXTERNAL_HREF_REGEX = /https?:\/\//;

export const Link = ({ href = '', className, ...props }: AnchorProps) => (
    <Anchor
        href={href}
        newWindow={EXTERNAL_HREF_REGEX.test(href)}
        className={cn(
            '_text-primary-600 _underline _decoration-from-font [text-underline-position:from-font]',
            className,
        )}
        {...props}
    />
);

const classes = {
    toc: cn('nextra-toc _order-last _hidden _w-64 _shrink-0 xl:_block print:_hidden'),
    main: cn('_w-full _break-words'),
};

interface BodyProps {
    themeContext: any;
    frontMatter: any;
    children: ReactNode;
}

function Body({ themeContext, children }: BodyProps): ReactElement {
    const config = useConfig();
    const themeConfig = useThemeConfig();
    const mounted = useMounted();

    const { activeType, activeIndex, activePath, flatDocsDirectories } =
        config.normalizePagesResult;

    const breadcrumb =
        activeType !== 'page' && themeContext.breadcrumb ? (
            <Breadcrumb activePath={activePath} />
        ) : null;

    const navigation =
        activeType !== 'page' && themeContext.pagination ? (
            <NavLinks flatDirectories={flatDocsDirectories} currentIndex={activeIndex} />
        ) : null;

    if (themeContext.layout === 'raw') {
        return <div className={classes.main}>{children}</div>;
    }

    const date =
        themeContext.timestamp && themeConfig.gitTimestamp && config.timestamp
            ? new Date(config.timestamp)
            : null;

    const gitTimestampEl =
        // Because a user's time zone may be different from the server page
        mounted && date ? (
            <div className="_mt-12 _mb-8 _block _text-xs _text-gray-500 ltr:_text-right rtl:_text-left dark:_text-gray-400">
                {renderComponent(themeConfig.gitTimestamp, { timestamp: date })}
            </div>
        ) : (
            <div className="_mt-16" />
        );

    const content = (
        <>
            {children}
            {gitTimestampEl}
            {navigation}
        </>
    );

    const body = themeConfig.main?.({ children: content }) || content;

    if (themeContext.layout === 'full') {
        return (
            <article
                className={cn(
                    classes.main,
                    'nextra-content _min-h-[calc(100vh-var(--nextra-navbar-height))] _pl-[max(env(safe-area-inset-left),1.5rem)] _pr-[max(env(safe-area-inset-right),1.5rem)]',
                )}
            >
                {body as ReactNode}
            </article>
        );
    }

    return (
        <article
            className={cn(
                classes.main,
                'nextra-content _flex _min-h-[calc(100vh-var(--nextra-navbar-height))] _min-w-0 _justify-center _pb-8 _pr-[calc(env(safe-area-inset-right)-1.5rem)]',
                themeContext.typesetting === 'article' && 'nextra-body-typesetting-article',
            )}
        >
            <main className="_w-full _min-w-0 _max-w-6xl _px-6 _pt-4 md:_px-12">
                {breadcrumb}
                {body as ReactNode}
            </main>
        </article>
    );
}

export const getComponents = ({
    frontMatter,
    isRawLayout,
    components,
}: {
    frontMatter: any;
    isRawLayout?: boolean;
    components?: DocsThemeConfig['components'];
}): MDXComponents => {
    const context = { index: 0 };

    return {
        wrapper: function NextraWrapper({
            toc,
            children,
        }: {
            toc: Heading[];
            children: ReactNode;
        }) {
            const config = useConfig();
            const themeConfig = useThemeConfig();
            const {
                activeType,
                activeThemeContext: themeContext,
                docsDirectories,
                directories,
            } = config.normalizePagesResult;

            const tocEl =
                activeType === 'page' || !themeContext.toc || themeContext.layout !== 'default' ? (
                    themeContext.layout !== 'full' &&
                    themeContext.layout !== 'raw' && (
                        <nav className={classes.toc} aria-label="table of contents" />
                    )
                ) : (
                    <nav className={cn(classes.toc, '_px-4')} aria-label="table of contents">
                        {renderComponent(themeConfig.toc.component, {
                            toc: themeConfig.toc.float ? toc : [],
                            filePath: config.filePath,
                        })}
                    </nav>
                );

            return (
                <div
                    className={cn(
                        '_mx-auto _flex',
                        themeContext.layout !== 'raw' && '_max-w-[90rem]',
                    )}
                >
                    <Sidebar
                        docsDirectories={docsDirectories}
                        fullDirectories={directories}
                        toc={toc}
                        asPopover={config.hideSidebar}
                        includePlaceholder={themeContext.layout === 'default'}
                    />
                    {tocEl}
                    <SkipNavContent />
                    <Body
                        frontMatter={frontMatter}
                        themeContext={{ ...themeContext, ...frontMatter }}
                    >
                        {children}
                    </Body>
                </div>
            );
        },
        section: props => {
            const maxRank = 2;
            if (
                !isRawLayout &&
                props.className === 'heading' &&
                frontMatter.auto_sections !== false
            ) {
                const children = props?.children as ReactNode[];
                if (!children || !Array.isArray(children) || props['data-heading-rank'] > maxRank)
                    return children;

                const showInCard = (el: ReactNode) =>
                    !(el as ReactElement).props?.['data-heading-rank'] ||
                    (el as ReactElement).props?.['data-heading-rank'] > maxRank;
                const shownInCard = children?.slice(1)?.filter(el => showInCard(el));
                // Check if it has any children that are not empty when trimmed
                const shownInCardIsNotEmpty = shownInCard.some(
                    el => typeof el !== 'string' || el.trim() !== '',
                );
                const otherChildren = children?.slice(1)?.filter(el => !showInCard(el));

                return (
                    <>
                        {children?.[0]}
                        {shownInCardIsNotEmpty && <Card>{shownInCard}</Card>}
                        {otherChildren}
                    </>
                );
            }

            return <section {...props} />;
        },
        h1: props => (
            // eslint-disable-next-line jsx-a11y/heading-has-content
            <h1
                className="_mt-2 _mb-2 _text-4xl _font-bold _tracking-tight _text-slate-900 dark:_text-slate-100"
                {...props}
            />
        ),
        h2: props => <HeadingLink tag="h2" context={context} {...props} />,
        h3: props => <HeadingLink tag="h3" context={context} {...props} />,
        h4: props => <HeadingLink tag="h4" context={context} {...props} />,
        h5: props => <HeadingLink tag="h5" context={context} {...props} />,
        h6: props => <HeadingLink tag="h6" context={context} {...props} />,
        ul: props => <ul className="_mt-6 _list-disc first:_mt-0 ltr:_ml-6 rtl:_mr-6" {...props} />,
        ol: props => (
            <ol className="_mt-6 _list-decimal first:_mt-0 ltr:_ml-6 rtl:_mr-6" {...props} />
        ),
        li: props => <li className="_my-2" {...props} />,
        blockquote: props => (
            <blockquote
                className={cn(
                    '_mt-6 _border-gray-300 _italic _text-gray-700 dark:_border-gray-700 dark:_text-gray-400',
                    'first:_mt-0 ltr:_border-l-2 ltr:_pl-6 rtl:_border-r-2 rtl:_pr-6',
                )}
                {...props}
            />
        ),
        hr: props => (
            <hr
                className="_my-8 _border-neutral-200/70 contrast-more:_border-neutral-400 dark:_border-primary-100/10 contrast-more:dark:_border-neutral-400"
                {...props}
            />
        ),
        a: Link,
        table: props => (
            <Table className={cn('nextra-scrollbar _mt-6 _p-0 first:_mt-0')} {...props} />
        ),
        p: props => <p className="_mt-4 _leading-7 first:_mt-0" {...props} />,
        tr: Tr,
        th: Th,
        td: Td,
        details: Details,
        summary: Summary,
        pre: props => <Pre {...props} />,
        code: Code,
        ...components,
    };
};
