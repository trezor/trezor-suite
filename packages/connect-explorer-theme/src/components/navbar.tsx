import type { ReactElement, ReactNode } from 'react';

import { Menu, Transition } from '@headlessui/react';
import styled from 'styled-components';
import cn from 'clsx';
import { useFSRoute } from 'nextra/hooks';
import { ArrowRightIcon, MenuIcon } from 'nextra/icons';
import type { Item, MenuItem, PageItem } from 'nextra/normalize-pages';

import { Elevation, borders, mapElevationToBackground, spacingsPx } from '@trezor/theme';
import { useElevation } from '@trezor/components';
import { TrezorLogo } from '@trezor/product-components';

import { useConfig, useMenu } from '../contexts';
import { renderComponent } from '../utils';
import { Anchor } from './anchor';

const Container = styled.div<{ $elevation: Elevation }>`
    border-radius: ${borders.radii.full};
    margin: 0 -${spacingsPx.sm};
    padding: ${spacingsPx.md} ${spacingsPx.xl};
    background-color: ${mapElevationToBackground};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    flex-direction: row;
    display: flex;
    flex: 1;
    gap: ${spacingsPx.md};
`;

export type NavBarProps = {
    flatDirectories: Item[];
    items: (PageItem | MenuItem)[];
};

const classes = {
    link: cn('nx-text-sm contrast-more:nx-text-gray-700 contrast-more:dark:nx-text-gray-100'),
    active: cn('nx-font-medium nx-subpixel-antialiased'),
    inactive: cn(
        'nx-text-gray-600 hover:nx-text-gray-800 dark:nx-text-gray-400 dark:hover:nx-text-gray-200',
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
        <div className="nx-relative nx-inline-block">
            <Menu>
                <Menu.Button
                    className={cn(
                        className,
                        '-nx-ml-2 nx-hidden nx-items-center nx-whitespace-nowrap nx-rounded nx-p-2 md:nx-inline-flex',
                        classes.inactive,
                    )}
                >
                    {children}
                </Menu.Button>
                <Transition
                    leave="nx-transition-opacity"
                    leaveFrom="nx-opacity-100"
                    leaveTo="nx-opacity-0"
                >
                    <Menu.Items className="nx-absolute nx-right-0 nx-z-20 nx-mt-1 nx-max-h-64 nx-min-w-full nx-overflow-auto nx-rounded-md nx-ring-1 nx-ring-black/5 nx-bg-white nx-py-1 nx-text-sm nx-shadow-lg dark:nx-ring-white/20 dark:nx-bg-neutral-800">
                        {Object.entries(items || {}).map(([key, item]) => (
                            <Menu.Item key={key}>
                                <Anchor
                                    href={item.href || routes[key]?.route || menu.route + '/' + key}
                                    className={cn(
                                        'nx-relative nx-hidden nx-w-full nx-select-none nx-whitespace-nowrap nx-text-gray-600 hover:nx-text-gray-900 dark:nx-text-gray-400 dark:hover:nx-text-gray-100 md:nx-inline-block',
                                        'nx-py-1.5 nx-transition-colors ltr:nx-pl-3 ltr:nx-pr-9 rtl:nx-pr-3 rtl:nx-pl-9',
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

export function Navbar({ flatDirectories, items }: NavBarProps): ReactElement {
    const config = useConfig();
    const { elevation } = useElevation();

    const activeRoute = useFSRoute();
    const { menu, setMenu } = useMenu();

    return (
        <div className="nextra-nav-container nx-sticky nx-top-[8px] nx-mt-[32px] nx-z-20 nx-w-full nx-bg-transparent print:nx-hidden">
            <nav className="nx-mx-auto nx-flex nx-h-[var(--nextra-navbar-height)] nx-max-w-[90rem] nx-items-start nx-justify-end nx-gap-2 nx-pl-[max(env(safe-area-inset-left),1.5rem)] nx-pr-[max(env(safe-area-inset-right),1.5rem)]">
                <Container $elevation={elevation}>
                    {config.logoLink ? (
                        <Anchor
                            href={typeof config.logoLink === 'string' ? config.logoLink : '/'}
                            className="nx-flex nx-items-center hover:nx-opacity-75 ltr:nx-mr-auto rtl:nx-ml-auto"
                            data-testid="@navbar-logo"
                        >
                            <TrezorLogo type="horizontal" width={150} />
                        </Anchor>
                    ) : (
                        <div className="nx-flex nx-items-center ltr:nx-mr-auto rtl:nx-ml-auto">
                            <TrezorLogo type="horizontal" width={150} />
                        </div>
                    )}

                    {renderComponent(config.search.component, {
                        directories: flatDirectories,
                        className: 'nx-hidden md:nx-inline-block mx-min-w-[200px]',
                    })}

                    {items.map(pageOrMenu => {
                        if (pageOrMenu.display === 'hidden') return null;

                        if (pageOrMenu.type === 'menu') {
                            const currentMenu = pageOrMenu as MenuItem;

                            return (
                                <NavbarMenu
                                    key={currentMenu.title}
                                    className={cn(
                                        classes.link,
                                        'nx-flex nx-gap-1',
                                        classes.inactive,
                                    )}
                                    menu={currentMenu}
                                >
                                    {currentMenu.title}
                                    <ArrowRightIcon
                                        className="nx-h-[18px] nx-min-w-[18px] nx-rounded-sm nx-p-0.5"
                                        pathClassName="nx-origin-center nx-transition-transform nx-rotate-90"
                                    />
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
                                    'nx-relative -nx-ml-2 nx-hidden nx-whitespace-nowrap nx-p-2 md:nx-inline-block',
                                    !isActive || page.newWindow ? classes.inactive : classes.active,
                                )}
                                newWindow={page.newWindow}
                                aria-current={!page.newWindow && isActive}
                            >
                                <span className="nx-absolute nx-inset-x-0 nx-text-center">
                                    {page.title}
                                </span>
                                <span className="nx-invisible nx-font-medium">{page.title}</span>
                            </Anchor>
                        );
                    })}

                    {config.project.link ? (
                        <Anchor
                            className="nx-p-2 nx-text-current"
                            href={config.project.link}
                            newWindow
                        >
                            {renderComponent(config.project.icon)}
                        </Anchor>
                    ) : null}

                    {config.chat.link ? (
                        <Anchor
                            className="nx-p-2 nx-text-current"
                            href={config.chat.link}
                            newWindow
                        >
                            {renderComponent(config.chat.icon)}
                        </Anchor>
                    ) : null}

                    {renderComponent(config.navbar.extraContent)}

                    <button
                        type="button"
                        aria-label="Menu"
                        className="nextra-hamburger -nx-mr-2 nx-rounded nx-p-2 active:nx-bg-gray-400/20 md:nx-hidden"
                        onClick={() => setMenu(!menu)}
                    >
                        <MenuIcon className={cn({ open: menu })} />
                    </button>
                </Container>
            </nav>
        </div>
    );
}
