import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import cn from 'clsx';
import { useRouter } from 'next/router';
import type { Heading } from 'nextra';
import { useMounted } from 'nextra/hooks';
import { ExpandIcon } from 'nextra/icons';
import type { Item, PageItem } from 'nextra/normalize-pages';
import scrollIntoView from 'scroll-into-view-if-needed';
import styled from 'styled-components';

import { variables } from '@trezor/components';

import { Collapse } from './collapse';
import { LocaleSwitch } from './locale-switch';
import { Menu } from './menu';
import { useMenu } from '../contexts/menu';
import { FocusedItemContext, OnFocusItemContext } from '../contexts/sidebar-focus';
import { useThemeConfig } from '../contexts/theme-config';
import { renderComponent } from '../utils/render';

const Container = styled.div`
    ${variables.SCREEN_QUERY.ABOVE_TABLET} {
        top: var(--nextra-navbar-height);
        height: calc(100vh - var(--nextra-navbar-height));
    }
`;

interface SideBarProps {
    docsDirectories: PageItem[];
    fullDirectories: Item[];
    asPopover?: boolean;
    toc: Heading[];
    includePlaceholder: boolean;
}

export function Sidebar({
    docsDirectories,
    fullDirectories,
    asPopover = false,
    toc,
    includePlaceholder,
}: SideBarProps): ReactElement {
    const themeConfig = useThemeConfig();
    const { menu, setMenu } = useMenu();
    const router = useRouter();
    const [focused, setFocused] = useState<null | string>(null);
    const [showSidebar, setSidebar] = useState(true);
    const [showToggleAnimation, setToggleAnimation] = useState(false);

    const anchors = useMemo(() => toc.filter(v => v.depth === 2), [toc]);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mounted = useMounted();
    useEffect(() => {
        if (menu) {
            document.body.classList.add('_overflow-hidden', 'md:_overflow-auto');
        } else {
            document.body.classList.remove('_overflow-hidden', 'md:_overflow-auto');
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

    const hasI18n = themeConfig.i18n.length > 0;
    const hasMenu = themeConfig.darkMode || hasI18n || themeConfig.sidebar.toggleButton;
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
                <div className="max-xl:_hidden _h-0 _w-64 _shrink-0" />
            ) : null}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
            <div
                className={cn(
                    'motion-reduce:_transition-none [transition:background-color_1.5s_ease]',
                    menu ? '_fixed _inset-0 _bg-black/80 dark:_bg-black/60' : '_bg-transparent',
                )}
                onClick={() => setMenu(false)}
            />
            <Container
                className={cn(
                    'nextra-sidebar-container _flex _flex-col',
                    'md:_shrink-0 motion-reduce:_transform-none',
                    '_transform-gpu _transition-all _ease-in-out',
                    'print:_hidden',
                    showSidebar ? 'md:_w-64' : 'md:_w-20',
                    asPopover ? 'md:_hidden' : 'md:_sticky md:_self-start',
                    menu
                        ? 'max-md:[transform:translate3d(0,0,0)]'
                        : 'max-md:[transform:translate3d(0,-100%,0)]',
                )}
                ref={containerRef}
            >
                <div className="_px-4 _pt-4 md:_hidden">
                    {renderComponent(themeConfig.search.component, {})}
                </div>
                <FocusedItemContext.Provider value={focused}>
                    <OnFocusItemContext.Provider
                        value={item => {
                            setFocused(item);
                        }}
                    >
                        <div
                            className={cn(
                                '_overflow-y-auto _overflow-x-hidden',
                                '_p-4 _grow md:_flex-1',
                                showSidebar ? 'nextra-scrollbar' : 'no-scrollbar',
                            )}
                            ref={sidebarRef}
                        >
                            {/* without asPopover check <Collapse />'s inner.clientWidth on `layout: "raw"` will be 0 and element will not have width on initial loading */}
                            {(!asPopover || !showSidebar) && (
                                <Collapse isOpen={showSidebar} horizontal>
                                    <Menu
                                        className="nextra-menu-desktop max-md:_hidden"
                                        // The sidebar menu, shows only the docs directories.
                                        directories={docsDirectories}
                                        // When the viewport size is larger than `md`, hide the anchors in
                                        // the sidebar when `floatTOC` is enabled.
                                        anchors={themeConfig.toc.float ? [] : anchors}
                                        onlyCurrentDocs
                                    />
                                </Collapse>
                            )}
                            {mounted && window.innerWidth < 768 && (
                                <Menu
                                    className="nextra-menu-mobile md:_hidden"
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
                            '_sticky _bottom-0',
                            '_mx-4 _py-4',
                            '_flex _items-center _gap-2',
                            'bg-page dark:_border-neutral-800',
                            showSidebar
                                ? cn(hasI18n && '_justify-end', '_border-t')
                                : '_py-4 _flex-wrap _justify-center',
                        )}
                        data-toggle-animation={getDataToggleAnimation()}
                    >
                        <LocaleSwitch
                            lite={!showSidebar}
                            className={cn(showSidebar ? '_grow' : 'max-md:_grow')}
                        />
                        {themeConfig.darkMode && (
                            <div className={showSidebar && !hasI18n ? '_grow _flex _flex-col' : ''}>
                                {renderComponent(themeConfig.themeSwitch.component, {
                                    lite: !showSidebar || hasI18n,
                                })}
                            </div>
                        )}
                        {themeConfig.sidebar.toggleButton && (
                            <button
                                title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
                                className="max-md:_hidden _h-7 _rounded-md _transition-colors _text-gray-600 dark:_text-gray-400 _px-2 hover:_bg-gray-100 hover:_text-gray-900 dark:hover:_bg-primary-100/5 dark:hover:_text-gray-50"
                                onClick={() => {
                                    setSidebar(!showSidebar);
                                    setToggleAnimation(true);
                                }}
                            >
                                <ExpandIcon className={cn(showSidebar && '_rotate-180')} />
                            </button>
                        )}
                    </div>
                )}
            </Container>
        </>
    );
}
