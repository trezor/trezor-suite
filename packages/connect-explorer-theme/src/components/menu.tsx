/* eslint-disable @typescript-eslint/no-use-before-define */
import {
    type ReactElement,
    createContext,
    memo,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useSelector } from 'react-redux';

import cn from 'clsx';
import { useRouter } from 'next/router';
import type { Heading } from 'nextra';
import { useFSRoute } from 'nextra/hooks';
import { ArrowRightIcon } from 'nextra/icons';
import type { Item, MenuItem, PageItem } from 'nextra/normalize-pages';
import { removeLinks } from 'nextra/remove-links';
import styled from 'styled-components';

import { Icon, type IconComponent, Select } from '@trezor/components';
import { BookIcon, LightningIcon, NewspaperIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { typography } from '@trezor/theme';
import { arrayPartition, typedObjectKeys } from '@trezor/utils';

import { Anchor } from './anchor';
import { Collapse } from './collapse';
import { useActiveAnchor } from '../contexts/active-anchor';
import { useMenu } from '../contexts/menu';
import { FocusedItemContext, OnFocusItemContext } from '../contexts/sidebar-focus';
import { useThemeConfig } from '../contexts/theme-config';
import { asNetworkRoute } from '../networkRoute';
import { selectNetworkRouteToSymbolMap } from '../selectors/networkRouteToSymbolMapSelectors';

const TreeState: Record<string, boolean> = Object.create(null);
const FolderLevelContext = createContext(0);

const classes = {
    link: cn(
        '_flex _rounded-xl _px-2 _py-1.5 _text-sm _transition-colors [word-break:break-word]',
        '_cursor-pointer [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] contrast-more:_border',
    ),
    inactive: cn(
        '_text-gray-500 hover:_bg-gray-100 hover:_text-gray-900',
        'dark:_text-neutral-400 dark:hover:_bg-primary-100/5 dark:hover:_text-gray-50',
        'contrast-more:_text-gray-900 contrast-more:dark:_text-gray-50',
        'contrast-more:_border-transparent contrast-more:hover:_border-gray-900 contrast-more:dark:hover:_border-gray-50',
    ),
    active: cn(
        '_bg-primary-100 _font-semibold _text-primary-800 dark:_bg-primary-400/10 dark:_text-primary-600',
        'contrast-more:_border-primary-500 contrast-more:dark:_border-primary-500',
    ),
    list: cn('_flex _flex-col _gap-1'),
    border: cn(
        '_relative before:_absolute before:_inset-y-1',
        'before:_w-px before:_bg-gray-200 before:_content-[""] dark:before:_bg-neutral-800',
        'ltr:_pl-3 ltr:before:_left-0 rtl:_pr-3 rtl:before:_right-0',
    ),
};

const MenuCategory = styled.div`
    padding: 1rem 0 0.5rem 0;
    font-weight: 600;
    text-transform: uppercase;
    ${typography['body-xs']}
    color: ${({ theme }) => theme.contentPrimary};
`;

const SelectWrapper = styled.div`
    margin: 0 2px;
    margin-bottom: 0.5rem;
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const Label = styled.div`
    padding-left: 10px;
`;

const SIDEBAR_ICONS: Partial<Record<string, IconComponent>> = {
    book: BookIcon,
    lightning: LightningIcon,
    newspaper: NewspaperIcon,
};

const isFolder = (item: Item | PageItem) => Boolean(item.children?.length);

const hasIndexPage = (item: Item | PageItem) => Boolean(item.withIndexPage);

const getItemIcon = (item: Item | PageItem): string | undefined =>
    'frontMatter' in item ? item.frontMatter?.icon : undefined;

type TitleWithIconProps = {
    title: string;
    icon?: string;
};

function TitleWithIcon({ title, icon }: TitleWithIconProps): ReactElement {
    const IconComponent = icon ? SIDEBAR_ICONS[icon] : undefined;

    return (
        <div
            style={{
                alignItems: 'center',
                display: 'flex',
                gap: '0.5rem',
            }}
        >
            {IconComponent && <Icon as={IconComponent} size={16} />}
            {title}
        </div>
    );
}

interface MenuProps {
    directories: PageItem[] | Item[];
    anchors: Heading[];
    base?: string;
    className?: string;
    onlyCurrentDocs?: boolean;
}

function MenuInner({ directories, anchors, className, onlyCurrentDocs }: MenuProps): ReactElement {
    const renderStructure = (item: PageItem | Item) => {
        if (item.display === 'hidden') return null;

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

    const networkRouteToSymbolMap = useSelector(selectNetworkRouteToSymbolMap);
    const networkRoutes = typedObjectKeys(networkRouteToSymbolMap);
    const networkRoute = asNetworkRoute(route.split('/')[2] ?? '');
    const defaultActiveCoin = networkRoutes.includes(networkRoute)
        ? networkRoute
        : asNetworkRoute('bitcoin');
    const [activeCoin, setActiveCoin] = useState(defaultActiveCoin);
    useEffect(() => {
        // Only on route change
        if (route === prevRoute.current) return;
        prevRoute.current = route;

        if (defaultActiveCoin !== activeCoin) setActiveCoin(defaultActiveCoin);
    }, [route, activeCoin, setActiveCoin, defaultActiveCoin]);

    const topLevelItems = directories.filter(item => !isFolder(item) || hasIndexPage(item));
    const methodsItems =
        directories.find(item => isFolder(item) && item.name === 'methods')?.children ?? [];
    const [coinMethods, nonCoinMethods] = arrayPartition<Item | PageItem>(
        methodsItems,
        item => isFolder(item) && networkRoutes.includes(asNetworkRoute(item.name)),
    );
    const methodsOptions = coinMethods.map(item => ({
        label: item.title,
        value: asNetworkRoute(item.name),
        symbol: networkRouteToSymbolMap[asNetworkRoute(item.name)],
    }));
    const activeCoinItems = methodsItems.find(item => item.name === activeCoin)?.children;
    const [commonMethods, otherMethods] = arrayPartition(
        nonCoinMethods,
        item => isFolder(item) && item.name === 'common',
    );
    const commonMethodsItems = commonMethods[0]?.children ?? [];
    const otherFolders = directories.filter(
        item => isFolder(item) && item.name !== 'methods' && !hasIndexPage(item),
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
                    onChange={({ value }) => setActiveCoin(value)}
                    options={methodsOptions}
                    formatOptionLabel={option => (
                        <Option>
                            {option.symbol && <TokenIcon size={20} symbol={option.symbol} />}
                            <Label>{option.label}</Label>
                        </Option>
                    )}
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
            <MenuCategory>Common Methods</MenuCategory>
            <MenuInner
                directories={commonMethodsItems}
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
    const [route = ''] = routeOriginal.split('#');
    const active = [route, route + '/'].includes(item.route + '/');
    const activeRouteInside = active || route.startsWith(item.route + '/');

    const focusedRoute = useContext(FocusedItemContext);
    const focusedRouteInside = !!focusedRoute?.startsWith(item.route + '/');
    const level = useContext(FolderLevelContext);

    const { setMenu } = useMenu();
    const themeConfig = useThemeConfig();
    const { theme } = item as Item;
    const open =
        TreeState[item.route] === undefined
            ? active ||
              activeRouteInside ||
              focusedRouteInside ||
              (theme && 'collapsed' in theme
                  ? !theme.collapsed
                  : level < themeConfig.sidebar.defaultMenuCollapseLevel)
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
        if (themeConfig.sidebar.autoCollapse) updateAndPruneTreeState();
        else updateTreeState();
    }, [activeRouteInside, focusedRouteInside, item.route, themeConfig.sidebar.autoCollapse]);

    if (item.type === 'menu') {
        const menu = item as MenuItem;
        const routes = Object.fromEntries(
            (menu.children || []).map(routeFromChildren => [
                routeFromChildren.name,
                routeFromChildren,
            ]),
        );
        const children = Object.entries(menu.items || {}).map(([key, menuItem]) => {
            const routeMenuItem = routes[key] ?? {
                name: key,
                ...('locale' in menu && { locale: menu.locale }),
                route: menu.route + '/' + key,
            };

            return {
                ...routeMenuItem,
                ...menuItem,
            };
        });
        // @ts-expect-error: fallback routeMenuItem is a partial PageItem (missing title/type)
        // eslint-disable-next-line react-hooks/immutability
        item.children = children;
    }

    const isLink = 'withIndexPage' in item && item.withIndexPage;
    // use button when link don't have href because it impacts on SEO
    const ComponentToUse = isLink ? Anchor : 'button';

    return (
        <li className={cn({ open, active })}>
            <ComponentToUse
                href={isLink ? item.route : undefined}
                className={cn(
                    '_items-center _justify-between _gap-2',
                    !isLink && '_text-left _w-full',
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
                <TitleWithIcon title={item.title} icon={getItemIcon(item)} />
                <ArrowRightIcon
                    className={cn(
                        '_h-[18px] _min-w-[18px] _rounded-sm _p-0.5 hover:_bg-gray-800/5 dark:hover:_bg-gray-100/5',
                        '_origin-center _transition-transform rtl:_-rotate-180',
                        open && 'ltr:_rotate-90 rtl:_rotate-[-270deg]',
                    )}
                />
            </ComponentToUse>
            <Collapse className="ltr:_pr-0 rtl:_pl-0 _pt-1" isOpen={open}>
                {Array.isArray(item.children) ? (
                    <MenuInner
                        className={cn(classes.border, 'ltr:_ml-3 rtl:_mr-3')}
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
    return (
        <li
            className={cn(
                '[word-break:break-word]',
                title
                    ? '_mt-5 _mb-2 _px-2 _py-1.5 _text-sm _font-semibold _text-gray-900 first:_mt-0 dark:_text-gray-100'
                    : '_my-4',
            )}
        >
            {title ? (
                <TitleWithIcon title={title} />
            ) : (
                <hr className="_mx-2 _border-t _border-gray-200 dark:_border-primary-100/10" />
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
                <TitleWithIcon title={item.title} icon={getItemIcon(item)} />
            </Anchor>
            {active && anchors.length > 0 && (
                <ul className={cn(classes.list, classes.border, 'ltr:_ml-3 rtl:_mr-3')}>
                    {anchors.map(({ id, value }) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                className={cn(
                                    classes.link,
                                    '_flex _gap-2 before:_opacity-25 before:_content-["#"]',
                                    activeAnchor[id]?.isActive ? classes.active : classes.inactive,
                                )}
                                onClick={() => {
                                    setMenu(false);
                                }}
                            >
                                {removeLinks(value)}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}
