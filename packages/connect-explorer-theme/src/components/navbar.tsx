import type { ReactElement, ReactNode } from 'react';

import { Menu, Transition } from '@headlessui/react';
import cn from 'clsx';
import { useFSRoute } from 'nextra/hooks';
import { ArrowRightIcon, MenuIcon } from 'nextra/icons';
import type { MenuItem, PageItem } from 'nextra/normalize-pages';
import styled from 'styled-components';

import { useElevation } from '@trezor/components';
import { TrezorLogo } from '@trezor/product-components';
import { type Elevation, borders, mapElevationToBackground, spacingsPx } from '@trezor/theme';

import { Anchor } from './anchor';
import { useMenu } from '../contexts/menu';
import { useThemeConfig } from '../contexts/theme-config';
import { renderComponent } from '../utils/render';

const Container = styled.div<{ $elevation: Elevation }>`
    border-radius: ${borders.radii.full};
    margin: 0 -${spacingsPx.sm};
    padding: ${spacingsPx.md} ${spacingsPx.xl};
    background-color: ${mapElevationToBackground};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    align-items: center;
    flex-direction: row;
    display: flex;
    flex: 1;
    gap: ${spacingsPx.md};
`;

const classes = {
    link: cn('_text-sm contrast-more:_text-gray-700 contrast-more:dark:_text-gray-100'),
    active: cn('_font-medium _subpixel-antialiased'),
    inactive: cn(
        '_text-gray-600 hover:_text-gray-800 dark:_text-gray-400 dark:hover:_text-gray-200',
    ),
};

function NavbarMenu({
    className,
    menu,
    children,
}: {
    className?: string;
    menu: MenuItem;
    children: ReactNode;
}): ReactElement {
    const { items } = menu;
    const routes = Object.fromEntries((menu.children || []).map(route => [route.name, route]));

    return (
        <div className="_relative _inline-block">
            <Menu>
                <Menu.Button
                    className={cn(
                        className,
                        '_-ml-2 _hidden _items-center _whitespace-nowrap _rounded _p-2 md:_inline-flex',
                        classes.inactive,
                    )}
                >
                    {children}
                </Menu.Button>
                <Transition
                    leave="_transition-opacity"
                    leaveFrom="_opacity-100"
                    leaveTo="_opacity-0"
                >
                    <Menu.Items className="_absolute _right-0 _z-20 _mt-1 _max-h-64 _min-w-full _overflow-auto _rounded-md _ring-1 _ring-black/5 _bg-white _py-1 _text-sm _shadow-lg dark:_ring-white/20 dark:_bg-neutral-800">
                        {Object.entries(items || {}).map(([key, item]) => (
                            <Menu.Item key={key}>
                                <Anchor
                                    href={item.href || routes[key]?.route || menu.route + '/' + key}
                                    className={cn(
                                        '_relative _hidden _w-full _select-none _whitespace-nowrap _text-gray-600 hover:_text-gray-900 dark:_text-gray-400 dark:hover:_text-gray-100 md:_inline-block',
                                        '_py-1.5 _transition-colors ltr:_pl-3 ltr:_pr-9 rtl:_pr-3 rtl:_pl-9',
                                    )}
                                    newWindow={item.newWindow}
                                >
                                    {item.title || key}
                                </Anchor>
                            </Menu.Item>
                        ))}
                    </Menu.Items>
                </Transition>
            </Menu>
        </div>
    );
}

export function Navbar({ items }: { items: (PageItem | MenuItem)[] }): ReactElement {
    const themeConfig = useThemeConfig();
    const { elevation } = useElevation();

    const activeRoute = useFSRoute();
    const { menu, setMenu } = useMenu();

    return (
        <div className="nextra-nav-container _sticky _top-[8px] _mt-[32px] _z-20 _w-full _bg-transparent print:_hidden">
            <nav className="_mx-auto _flex _h-[var(--nextra-navbar-height)] _max-w-[90rem] _items-start _justify-end _gap-2 _pl-[max(env(safe-area-inset-left),1.5rem)] _pr-[max(env(safe-area-inset-right),1.5rem)]">
                <Container $elevation={elevation}>
                    {themeConfig.logoLink ? (
                        <Anchor
                            href={
                                typeof themeConfig.logoLink === 'string'
                                    ? themeConfig.logoLink
                                    : '/'
                            }
                            className="_flex _items-center hover:_opacity-75 ltr:_mr-auto rtl:_ml-auto"
                            data-testid="@navbar-logo"
                        >
                            <TrezorLogo type="horizontal" width={150} />
                        </Anchor>
                    ) : (
                        <div className="_flex _items-center ltr:_mr-auto rtl:_ml-auto">
                            <TrezorLogo type="horizontal" width={150} />
                        </div>
                    )}

                    {renderComponent(themeConfig.search.component, {
                        className: '_hidden md:_inline-block _min-w-[200px]',
                    })}

                    {items.map(pageOrMenu => {
                        if (pageOrMenu.display === 'hidden') return null;

                        if (pageOrMenu.type === 'menu') {
                            const currentMenu = pageOrMenu as MenuItem;

                            return (
                                <NavbarMenu
                                    key={currentMenu.title}
                                    className={cn(classes.link, '_flex _gap-1', classes.inactive)}
                                    menu={currentMenu}
                                >
                                    {currentMenu.title}
                                    <ArrowRightIcon className="_h-[18px] _min-w-[18px] _rounded-sm _p-0.5 _origin-center _transition-transform _rotate-90" />
                                </NavbarMenu>
                            );
                        }
                        const page = pageOrMenu as PageItem;
                        let href = page.href || page.route || '#';

                        // If it's a directory
                        if (page.children) {
                            href = (page.withIndexPage ? page.route : page.firstChildRoute) || href;
                        }

                        const isActive =
                            page.route === activeRoute || activeRoute.startsWith(page.route + '/');

                        return (
                            <Anchor
                                href={href}
                                key={href}
                                className={cn(
                                    classes.link,
                                    '_relative _-ml-2 _hidden _whitespace-nowrap _p-2 md:_inline-block',
                                    !isActive || page.newWindow ? classes.inactive : classes.active,
                                )}
                                newWindow={page.newWindow}
                                aria-current={!page.newWindow && isActive}
                            >
                                <span className="_absolute _inset-x-0 _text-center">
                                    {page.title}
                                </span>
                                <span className="_invisible _font-medium">{page.title}</span>
                            </Anchor>
                        );
                    })}

                    {themeConfig.project.link ? (
                        <Anchor
                            className="_p-2 _text-current"
                            href={themeConfig.project.link}
                            newWindow
                        >
                            {renderComponent(themeConfig.project.icon)}
                        </Anchor>
                    ) : null}

                    {themeConfig.chat.link ? (
                        <Anchor
                            className="_p-2 _text-current"
                            href={themeConfig.chat.link}
                            newWindow
                        >
                            {renderComponent(themeConfig.chat.icon)}
                        </Anchor>
                    ) : null}

                    {renderComponent(themeConfig.navbar.extraContent)}

                    <button
                        type="button"
                        aria-label="Menu"
                        className="nextra-hamburger _-mr-2 _rounded _p-2 active:_bg-gray-400/20 md:_hidden"
                        onClick={() => setMenu(!menu)}
                    >
                        <MenuIcon className={cn({ open: menu })} />
                    </button>
                </Container>
            </nav>
        </div>
    );
}
