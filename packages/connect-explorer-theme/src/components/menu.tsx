/* eslint-disable @typescript-eslint/no-use-before-define */
import type { ReactElement } from 'react';
import { createContext, memo, useContext, useEffect, useRef, useState } from 'react';

import cn from 'clsx';
import type { Heading } from 'nextra';
import { useFSRoute } from 'nextra/hooks';
import { ArrowRightIcon } from 'nextra/icons';
import type { Item, MenuItem, PageItem } from 'nextra/normalize-pages';
import styled from 'styled-components';
import { useRouter } from 'next/router';

import { CoinLogo, Select, variables } from '@trezor/components';

import { useActiveAnchor, useConfig, useMenu } from '../contexts';
import { renderComponent } from '../utils';
import { Anchor } from './anchor';
import { Collapse } from './collapse';
import { FocusedItemContext, OnFocusItemContext } from './sidebar';

const TreeState: Record<string, boolean> = Object.create(null);
const FolderLevelContext = createContext(0);

const classes = {
    link: cn(
        'nx-flex nx-rounded-xl nx-px-2 nx-py-1.5 nx-text-sm nx-transition-colors [word-break:break-word]',
        'nx-cursor-pointer [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] contrast-more:nx-border',
    ),
    inactive: cn(
        'nx-text-gray-500 hover:nx-bg-gray-100 hover:nx-text-gray-900',
        'dark:nx-text-neutral-400 dark:hover:nx-bg-primary-100/5 dark:hover:nx-text-gray-50',
        'contrast-more:nx-text-gray-900 contrast-more:dark:nx-text-gray-50',
        'contrast-more:nx-border-transparent contrast-more:hover:nx-border-gray-900 contrast-more:dark:hover:nx-border-gray-50',
    ),
    active: cn(
        'nx-bg-primary-100 nx-font-semibold nx-text-primary-800 dark:nx-bg-primary-400/10 dark:nx-text-primary-600',
        'contrast-more:nx-border-primary-500 contrast-more:dark:nx-border-primary-500',
    ),
    list: cn('nx-flex nx-flex-col nx-gap-1'),
    border: cn(
        'nx-relative before:nx-absolute before:nx-inset-y-1',
        'before:nx-w-px before:nx-bg-gray-200 before:nx-content-[""] dark:before:nx-bg-neutral-800',
        'ltr:nx-pl-3 ltr:before:nx-left-0 rtl:nx-pr-3 rtl:before:nx-right-0',
    ),
};

const MenuCategory = styled.div`
    padding: 1rem 0 0.5rem 0;
    font-weight: 600;
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.textDefault};
`;

const SelectWrapper = styled.div`
    margin-bottom: 0.5rem;
    .react-select__control {
        border-style: solid;
        border-color: ${({ theme }) => theme.borderElevation1};
    }
    .react-select__control:hover:not(:focus-within) {
        border-color: ${({ theme }) => theme.borderElevation0};
    }
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const Label = styled.div`
    padding-left: 10px;
`;

interface MenuProps {
    directories: PageItem[] | Item[];
    anchors: Heading[];
    base?: string;
    className?: string;
    onlyCurrentDocs?: boolean;
}

function MenuInner({ directories, anchors, className, onlyCurrentDocs }: MenuProps): ReactElement {
    const renderStructure = (item: PageItem | Item) => {
        if (!onlyCurrentDocs || item.isUnderCurrentDocsTree) {
            if (
                item.type === 'menu' ||
                (item.children && (item.children.length || !item.withIndexPage))
            ) {
                return <Folder key={item.name} item={item} anchors={anchors} />;
            }

            return <File key={item.name} item={item} anchors={anchors} />;
        }

        return null;
    };

    return <ul className={cn(classes.list, className)}>{directories.map(renderStructure)}</ul>;
}

export function Menu({
    directories,
    anchors,
    className,
    onlyCurrentDocs,
}: MenuProps): ReactElement {
    const router = useRouter();
    const route = useFSRoute();
    const prevRoute = useRef(route);

    const coinSymbols = {
        binance: 'bnb',
        bitcoin: 'btc',
        cardano: 'ada',
        eos: 'eos',
        ethereum: 'eth',
        litecoin: 'ltc',
        nem: 'nem',
        ripple: 'xrp',
        solana: 'sol',
        stellar: 'xlm',
        tezos: 'xtz',
    };
    const defaultActiveCoin = Object.keys(coinSymbols).includes(route.split('/')[2])
        ? route.split('/')[2]
        : 'bitcoin';
    const [activeCoin, setActiveCoin] = useState(defaultActiveCoin);
    useEffect(() => {
        // Only on route change
        if (route === prevRoute.current) return;
        prevRoute.current = route;

        if (defaultActiveCoin !== activeCoin) setActiveCoin(defaultActiveCoin);
    }, [route, activeCoin, setActiveCoin, defaultActiveCoin]);

    const topLevelItems = directories.filter(item => item.kind !== 'Folder');
    const methodsItems =
        directories.find(item => item.kind === 'Folder' && item.name === 'methods')?.children ?? [];
    const methodsOptions = methodsItems
        ?.filter(item => item.kind === 'Folder' && Object.keys(coinSymbols).includes(item.name))
        .map(item => ({
            label: item.title,
            value: item.name,
        }));
    const activeCoinItems = methodsItems?.find(item => item.name === activeCoin)?.children;
    const otherMethods = methodsItems?.filter(
        item => item.kind !== 'Folder' || !Object.keys(coinSymbols).includes(item.name),
    );
    const otherFolders = directories.filter(
        item => item.kind === 'Folder' && item.name !== 'methods',
    );

    const [clickCounter, setClickCounter] = useState(0);
    const handleClickMisc = () => {
        setClickCounter(clickCounter + 1);
        if (clickCounter < 5) return;

        router.push('/settings');
    };

    return (
        <div className={cn(className)}>
            <MenuCategory>Quick Access</MenuCategory>
            <MenuInner
                directories={topLevelItems}
                anchors={anchors}
                onlyCurrentDocs={onlyCurrentDocs}
            />
            <MenuCategory>Coin Methods</MenuCategory>
            <SelectWrapper>
                <Select
                    value={methodsOptions.find(d => d.value === activeCoin)}
                    onChange={({ value }) => {
                        return setActiveCoin(value);
                    }}
                    options={methodsOptions}
                    formatOptionLabel={option => (
                        <Option>
                            {coinSymbols[option.value] && (
                                <CoinLogo size={18} symbol={coinSymbols[option.value]} />
                            )}
                            <Label>{option.label}</Label>
                        </Option>
                    )}
                    menuPosition="absolute"
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    menuShouldScrollIntoView={false}
                    maxMenuHeight={400}
                    data-testid="@select-coin"
                />
            </SelectWrapper>
            <MenuInner
                directories={activeCoinItems ?? []}
                anchors={anchors}
                onlyCurrentDocs={onlyCurrentDocs}
            />
            <MenuCategory onClick={handleClickMisc}>Miscellaneous</MenuCategory>
            <MenuInner
                directories={[...otherMethods, ...otherFolders]}
                anchors={anchors}
                onlyCurrentDocs={onlyCurrentDocs}
            />
        </div>
    );
}

type FolderProps = {
    item: PageItem | MenuItem | Item;
    anchors: Heading[];
};

export const Folder = memo(function FolderInner(props: FolderProps) {
    const level = useContext(FolderLevelContext);

    return (
        <FolderLevelContext.Provider value={level + 1}>
            <FolderImpl {...props} />
        </FolderLevelContext.Provider>
    );
});

export function FolderImpl({ item, anchors }: FolderProps): ReactElement {
    const routeOriginal = useFSRoute();
    const [route] = routeOriginal.split('#');
    const active = [route, route + '/'].includes(item.route + '/');
    const activeRouteInside = active || route.startsWith(item.route + '/');

    const focusedRoute = useContext(FocusedItemContext);
    const focusedRouteInside = !!focusedRoute?.startsWith(item.route + '/');
    const level = useContext(FolderLevelContext);

    const { setMenu } = useMenu();
    const config = useConfig();
    const { theme } = item as Item;
    const open =
        TreeState[item.route] === undefined
            ? active ||
              activeRouteInside ||
              focusedRouteInside ||
              (theme && 'collapsed' in theme
                  ? !theme.collapsed
                  : level < config.sidebar.defaultMenuCollapseLevel)
            : TreeState[item.route] || focusedRouteInside;

    const rerender = useState({})[1];

    useEffect(() => {
        const updateTreeState = () => {
            if (activeRouteInside || focusedRouteInside) {
                TreeState[item.route] = true;
            }
        };
        const updateAndPruneTreeState = () => {
            if (activeRouteInside && focusedRouteInside) {
                TreeState[item.route] = true;
            } else {
                delete TreeState[item.route];
            }
        };
        if (config.sidebar.autoCollapse) updateAndPruneTreeState();
        else updateTreeState();
    }, [activeRouteInside, focusedRouteInside, item.route, config.sidebar.autoCollapse]);

    if (item.type === 'menu') {
        const menu = item as MenuItem;
        const routes = Object.fromEntries(
            (menu.children || []).map(routeFromChildren => [
                routeFromChildren.name,
                routeFromChildren,
            ]),
        );
        item.children = Object.entries(menu.items || {}).map(([key, menuItem]) => {
            const routeMenuItem = routes[key] || {
                name: key,
                ...('locale' in menu && { locale: menu.locale }),
                route: menu.route + '/' + key,
            };

            return {
                ...routeMenuItem,
                ...menuItem,
            };
        });
    }

    const isLink = 'withIndexPage' in item && item.withIndexPage;
    // use button when link don't have href because it impacts on SEO
    const ComponentToUse = isLink ? Anchor : 'button';

    return (
        <li className={cn({ open, active })}>
            <ComponentToUse
                href={isLink ? item.route : undefined}
                className={cn(
                    'nx-items-center nx-justify-between nx-gap-2',
                    !isLink && 'nx-text-left nx-w-full',
                    classes.link,
                    active ? classes.active : classes.inactive,
                )}
                onClick={e => {
                    const clickedToggleIcon = ['svg', 'path'].includes(
                        (e.target as HTMLElement).tagName.toLowerCase(),
                    );
                    if (clickedToggleIcon) {
                        e.preventDefault();
                    }
                    if (isLink) {
                        // If it's focused, we toggle it. Otherwise, always open it.
                        if (active || clickedToggleIcon) {
                            TreeState[item.route] = !open;
                        } else {
                            TreeState[item.route] = true;
                            setMenu(false);
                        }
                        rerender({});

                        return;
                    }
                    if (active) return;
                    TreeState[item.route] = !open;
                    rerender({});
                }}
            >
                {renderComponent(config.sidebar.titleComponent, {
                    title: item.title,
                    type: item.type,
                    route: item.route,
                })}
                <ArrowRightIcon
                    className="nx-h-[18px] nx-min-w-[18px] nx-rounded-sm nx-p-0.5 hover:nx-bg-gray-800/5 dark:hover:nx-bg-gray-100/5"
                    pathClassName={cn(
                        'nx-origin-center nx-transition-transform rtl:-nx-rotate-180',
                        open && 'ltr:nx-rotate-90 rtl:nx-rotate-[-270deg]',
                    )}
                />
            </ComponentToUse>
            <Collapse className="ltr:nx-pr-0 rtl:nx-pl-0 nx-pt-1" isOpen={open}>
                {Array.isArray(item.children) ? (
                    <MenuInner
                        className={cn(classes.border, 'ltr:nx-ml-3 rtl:nx-mr-3')}
                        directories={item.children}
                        base={item.route}
                        anchors={anchors}
                    />
                ) : null}
            </Collapse>
        </li>
    );
}

export function Separator({ title }: { title: string }): ReactElement {
    const config = useConfig();

    return (
        <li
            className={cn(
                '[word-break:break-word]',
                title
                    ? 'nx-mt-5 nx-mb-2 nx-px-2 nx-py-1.5 nx-text-sm nx-font-semibold nx-text-gray-900 first:nx-mt-0 dark:nx-text-gray-100'
                    : 'nx-my-4',
            )}
        >
            {title ? (
                renderComponent(config.sidebar.titleComponent, {
                    title,
                    type: 'separator',
                    route: '',
                })
            ) : (
                <hr className="nx-mx-2 nx-border-t nx-border-gray-200 dark:nx-border-primary-100/10" />
            )}
        </li>
    );
}

export function File({
    item,
    anchors,
}: {
    item: PageItem | Item;
    anchors: Heading[];
}): ReactElement {
    const route = useFSRoute();
    const onFocus = useContext(OnFocusItemContext);

    // It is possible that the item doesn't have any route - for example an external link.
    const active = item.route && [route, route + '/'].includes(item.route + '/');
    const activeAnchor = useActiveAnchor();
    const { setMenu } = useMenu();
    const config = useConfig();

    if (item.type === 'separator') {
        return <Separator title={item.title} />;
    }

    return (
        <li className={cn(classes.list, { active })}>
            <Anchor
                href={(item as PageItem).href || item.route}
                newWindow={(item as PageItem).newWindow}
                className={cn(classes.link, active ? classes.active : classes.inactive)}
                onClick={() => {
                    setMenu(false);
                }}
                onFocus={() => {
                    onFocus?.(item.route);
                }}
                onBlur={() => {
                    onFocus?.(null);
                }}
            >
                {renderComponent(config.sidebar.titleComponent, {
                    title: item.title,
                    type: item.type,
                    route: item.route,
                    icon: item.kind === 'MdxPage' && item.frontMatter?.icon,
                })}
            </Anchor>
            {active && anchors.length > 0 && (
                <ul className={cn(classes.list, classes.border, 'ltr:nx-ml-3 rtl:nx-mr-3')}>
                    {anchors.map(({ id, value }) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                className={cn(
                                    classes.link,
                                    'nx-flex nx-gap-2 before:nx-opacity-25 before:nx-content-["#"]',
                                    activeAnchor[id]?.isActive ? classes.active : classes.inactive,
                                )}
                                onClick={() => {
                                    setMenu(false);
                                }}
                            >
                                {value}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}
