import type { ReactElement } from 'react';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';

import cn from 'clsx';
import { useRouter } from 'next/router';
import type { Heading } from 'nextra';
import { useMounted } from 'nextra/hooks';
import { ExpandIcon } from 'nextra/icons';
import type { Item, PageItem } from 'nextra/normalize-pages';
import scrollIntoView from 'scroll-into-view-if-needed';
import styled from 'styled-components';

import { variables } from '@trezor/components';

import { useConfig, useMenu } from '../contexts';
import { renderComponent } from '../utils';
import { Collapse } from './collapse';
import { LocaleSwitch } from './locale-switch';
import { Menu } from './menu';

export const FocusedItemContext = createContext<null | string>(null);
export const OnFocusItemContext = createContext<null | ((item: string | null) => any)>(null);

const Container = styled.div`
    ${variables.SCREEN_QUERY.ABOVE_TABLET} {
        top: var(--nextra-navbar-height);
        height: calc(100vh - var(--nextra-navbar-height));
    }
`;

interface SideBarProps {
    docsDirectories: PageItem[];
    flatDirectories: Item[];
    fullDirectories: Item[];
    asPopover?: boolean;
    headings: Heading[];
    includePlaceholder: boolean;
}

export function Sidebar({
    docsDirectories,
    flatDirectories,
    fullDirectories,
    asPopover = false,
    headings,
    includePlaceholder,
}: SideBarProps): ReactElement {
    const config = useConfig();
    const { menu, setMenu } = useMenu();
    const router = useRouter();
    const [focused, setFocused] = useState<null | string>(null);
    const [showSidebar, setSidebar] = useState(true);
    const [showToggleAnimation, setToggleAnimation] = useState(false);

    const anchors = useMemo(() => headings.filter(v => v.depth === 2), [headings]);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mounted = useMounted();
    useEffect(() => {
        if (menu) {
            document.body.classList.add('nx-overflow-hidden', 'md:nx-overflow-auto');
        } else {
            document.body.classList.remove('nx-overflow-hidden', 'md:nx-overflow-auto');
        }
    }, [menu]);

    useEffect(() => {
        const activeElement = sidebarRef.current?.querySelector('li.active');

        if (activeElement && (window.innerWidth > 767 || menu)) {
            const scroll = () => {
                scrollIntoView(activeElement, {
                    block: 'center',
                    inline: 'center',
                    scrollMode: 'always',
                    boundary: containerRef.current,
                });
            };
            if (menu) {
                // needs for mobile since menu has transition transform
                setTimeout(scroll, 300);
            } else {
                scroll();
            }
        }
    }, [menu]);

    // Always close mobile nav when route was changed (e.g. logo click)
    useEffect(() => {
        setMenu(false);
    }, [router.asPath, setMenu]);

    const hasI18n = config.i18n.length > 0;
    const hasMenu = config.darkMode || hasI18n || config.sidebar.toggleButton;
    const getDataToggleAnimation = () => {
        if (showToggleAnimation) {
            if (showSidebar) {
                return 'show';
            } else {
                return 'hide';
            }
        }

        return 'off';
    };

    return (
        <>
            {includePlaceholder && asPopover ? (
                <div className="max-xl:nx-hidden nx-h-0 nx-w-64 nx-shrink-0" />
            ) : null}
            <div
                className={cn(
                    'motion-reduce:nx-transition-none [transition:background-color_1.5s_ease]',
                    menu
                        ? 'nx-fixed nx-inset-0 nx-z-10 nx-bg-black/80 dark:nx-bg-black/60'
                        : 'nx-bg-transparent',
                )}
                onClick={() => setMenu(false)}
            />
            <Container
                className={cn(
                    'nextra-sidebar-container nx-flex nx-flex-col',
                    'md:nx-shrink-0 motion-reduce:nx-transform-none',
                    'nx-transform-gpu nx-transition-all nx-ease-in-out',
                    'print:nx-hidden',
                    showSidebar ? 'md:nx-w-64' : 'md:nx-w-20',
                    asPopover ? 'md:nx-hidden' : 'md:nx-sticky md:nx-self-start',
                    menu
                        ? 'max-md:[transform:translate3d(0,0,0)]'
                        : 'max-md:[transform:translate3d(0,-100%,0)]',
                )}
                ref={containerRef}
            >
                <div className="nx-px-4 nx-pt-4 md:nx-hidden">
                    {renderComponent(config.search.component, {
                        directories: flatDirectories,
                    })}
                </div>
                <FocusedItemContext.Provider value={focused}>
                    <OnFocusItemContext.Provider
                        value={item => {
                            setFocused(item);
                        }}
                    >
                        <div
                            className={cn(
                                'nx-overflow-y-auto nx-overflow-x-hidden',
                                'nx-p-4 nx-grow md:nx-flex-1',
                                showSidebar ? 'nextra-scrollbar' : 'no-scrollbar',
                            )}
                            ref={sidebarRef}
                        >
                            {/* without asPopover check <Collapse />'s inner.clientWidth on `layout: "raw"` will be 0 and element will not have width on initial loading */}
                            {(!asPopover || !showSidebar) && (
                                <Collapse isOpen={showSidebar} horizontal>
                                    <Menu
                                        className="nextra-menu-desktop max-md:nx-hidden"
                                        // The sidebar menu, shows only the docs directories.
                                        directories={docsDirectories}
                                        // When the viewport size is larger than `md`, hide the anchors in
                                        // the sidebar when `floatTOC` is enabled.
                                        anchors={config.toc.float ? [] : anchors}
                                        onlyCurrentDocs
                                    />
                                </Collapse>
                            )}
                            {mounted && window.innerWidth < 768 && (
                                <Menu
                                    className="nextra-menu-mobile md:nx-hidden"
                                    // The mobile dropdown menu, shows all the directories.
                                    directories={fullDirectories}
                                    // Always show the anchor links on mobile (`md`).
                                    anchors={anchors}
                                />
                            )}
                        </div>
                    </OnFocusItemContext.Provider>
                </FocusedItemContext.Provider>

                {hasMenu && (
                    <div
                        className={cn(
                            'nx-sticky nx-bottom-0',
                            'nx-mx-4 nx-py-4',
                            'nx-flex nx-items-center nx-gap-2',
                            'bg-page dark:nx-border-neutral-800',
                            showSidebar
                                ? cn(hasI18n && 'nx-justify-end', 'nx-border-t')
                                : 'nx-py-4 nx-flex-wrap nx-justify-center',
                        )}
                        data-toggle-animation={getDataToggleAnimation()}
                    >
                        <LocaleSwitch
                            lite={!showSidebar}
                            className={cn(showSidebar ? 'nx-grow' : 'max-md:nx-grow')}
                        />
                        {config.darkMode && (
                            <div
                                className={
                                    showSidebar && !hasI18n ? 'nx-grow nx-flex nx-flex-col' : ''
                                }
                            >
                                {renderComponent(config.themeSwitch.component, {
                                    lite: !showSidebar || hasI18n,
                                })}
                            </div>
                        )}
                        {config.sidebar.toggleButton && (
                            <button
                                title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
                                className="max-md:nx-hidden nx-h-7 nx-rounded-md nx-transition-colors nx-text-gray-600 dark:nx-text-gray-400 nx-px-2 hover:nx-bg-gray-100 hover:nx-text-gray-900 dark:hover:nx-bg-primary-100/5 dark:hover:nx-text-gray-50"
                                onClick={() => {
                                    setSidebar(!showSidebar);
                                    setToggleAnimation(true);
                                }}
                            >
                                <ExpandIcon isOpen={showSidebar} />
                            </button>
                        )}
                    </div>
                )}
            </Container>
        </>
    );
}
