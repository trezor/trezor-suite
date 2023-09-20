import {
    useState,
    useRef,
    useLayoutEffect,
    forwardRef,
    useImperativeHandle,
    useCallback,
    ReactNode,
    Fragment,
    ButtonHTMLAttributes,
    ReactElement,
    ComponentType,
    cloneElement,
} from 'react';

import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import { useOnClickOutside } from '@trezor/react-utils';
import { FONT_WEIGHT, Z_INDEX, FONT_SIZE } from '../../config/variables';
import { animations } from '../../config';
import { useTheme } from '../../utils/hooks';
import { Icon, IconProps } from '../assets/Icon/Icon';

const Wrapper = styled.div<{ absolutePosition: boolean }>`
    position: ${props => (props.absolutePosition ? 'static' : 'relative')};
`;

const MasterLinkComponent = styled.button<{
    topMargin?: number;
    rightMargin?: number;
}>`
    border: 0;
    background: none;
    position: absolute;
    top: 15px;
    right: 10px;
    font-size: 11px;
    letter-spacing: 0.4px;
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-weight: ${FONT_WEIGHT.BOLD};
    text-transform: uppercase;
    display: flex;
    cursor: pointer;
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.3s ease;

    & > * + * {
        margin-left: 5px;
    }

    ${props =>
        props.topMargin &&
        css`
            margin-top: ${props.topMargin}px;
        `}

    ${props =>
        props.rightMargin &&
        css`
            margin-right: calc(${props.rightMargin}px + 5px);
        `}
`;

const MasterLinkComponentIcon = styled(Icon)`
    margin-top: 1px;
`;

const Menu = styled.ul<MenuProps>`
    display: flex;
    flex-direction: column;
    position: absolute;
    flex: 1;
    min-width: ${props => props.minWidth}px;
    box-shadow:
        0 2px 7px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_15},
        0 2px 3px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_5};
    padding: ${props => props.topPadding}px ${props => props.horizontalPadding}px
        ${props => props.bottomPadding}px;
    border-radius: 10px;
    z-index: ${Z_INDEX.NAVIGATION_BAR};
    animation: ${animations.DROPDOWN_MENU} 0.15s ease-in-out;

    ${props =>
        props.coords &&
        css`
            top: ${props.coords[1]}px;
            left: ${props.coords[0]}px;
        `}

    list-style-type: none;
    margin-top: ${props =>
        props.alignMenu === 'top-left' || props.alignMenu === 'top-right'
            ? `-${props.offset}px`
            : `${props.offset}px`};
    background: ${({ theme }) => theme.BG_WHITE};
    overflow: hidden;

    ${props =>
        props.alignMenu === 'left' &&
        !props.coords &&
        css`
            left: 0px;
        `};

    ${props =>
        props.alignMenu === 'right' &&
        !props.coords &&
        css`
            right: 0px;
        `};

    ${props =>
        props.alignMenu === 'top-left' &&
        !props.coords &&
        css`
            left: 0px;
            top: ${props.menuSize ? `-${props.menuSize[1]}px` : '0px'};
        `};

    ${props =>
        props.alignMenu === 'top-right' &&
        !props.coords &&
        css`
            right: 0px;
            top: ${props.menuSize ? `-${props.menuSize[1]}px` : '0px'};
        `};

    ${props =>
        props.borderRadius &&
        css`
            border-radius: ${props.borderRadius}px;
        `};

    &:hover ${MasterLinkComponent} {
        opacity: 1;
        transform: translateX(0);
    }
`;

const Group = styled.li`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${FONT_SIZE.TINY};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    padding: 10px 16px 10px 16px;
    cursor: default;
`;

const MenuItem = styled.li<MenuItemProps>`
    position: relative;
    display: flex;
    align-items: center;
    padding: ${({ item }) => (!item.noPadding ? '8px 16px' : '0px')};
    border-radius: ${({ item }) => item.isRounded && ' 4px'};
    color: ${({ item, theme }) =>
        !item.isDisabled ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY};
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    white-space: nowrap;
    transition: all 0.2s ease;
    cursor: ${({ item }) => (!item.isDisabled && !item.noHover ? 'pointer' : 'default')};

    :hover {
        background: ${({ item, theme }) =>
            !item.isDisabled && !item.noHover && theme.BG_WHITE_ALT_HOVER};
    }

    ${({ item, theme }) =>
        item.separatorBefore &&
        css`
            margin-top: 17px;

            :after {
                position: absolute;
                width: calc(100% - 32px);
                top: -9px;
                left: 16px;
                content: '';
                border-top: 1px solid ${theme.STROKE_GREY};
            }
        `}
`;

const MenuItemLabel = styled.div`
    width: 100%;
`;

const IconLeft = styled.div`
    margin-right: 16px;
`;

const IconRight = styled.div`
    margin-left: auto;
    & > * {
        margin-left: 16px;
    }
`;

const MoreIcon = styled(Icon)<{ $isDisabled?: boolean }>`
    transition: background 0.1s;
    border-radius: 6px;

    :hover {
        background: ${({ $isDisabled, theme }) => !$isDisabled && theme.STROKE_GREY};
    }
`;

interface DropdownMenuItem {
    key: string;
    label: ReactNode;
    callback?: () => any | Promise<any>;
    icon?: IconProps['icon'] | JSX.Element;
    iconRight?: IconProps['icon'];
    isDisabled?: boolean;
    isHidden?: boolean;
    isRounded?: boolean;
    noPadding?: boolean;
    noHover?: boolean;
    separatorBefore?: boolean;
    'data-test'?: string;
}

export interface GroupedMenuItems {
    key: string;
    options: DropdownMenuItem[];
    label?: ReactNode;
}

interface MenuItemProps {
    item: DropdownMenuItem;
}

interface MasterLink {
    label: ReactNode;
    icon: IconProps['icon'];
    callback?: () => void;
}
interface MenuProps {
    alignMenu?: 'left' | 'right' | 'top-left' | 'top-right';
    coords?: Coords;
    menuSize?: Coords;
    offset?: number;
    topPadding?: number;
    bottomPadding?: number;
    horizontalPadding?: number;
    borderRadius?: number;
    minWidth?: number;
    masterLink?: MasterLink;
}

type DropdownProps = MenuProps &
    Omit<ButtonHTMLAttributes<HTMLDivElement>, 'disabled'> & {
        children?: ReactElement<any>;
        absolutePosition?: boolean;
        items: GroupedMenuItems[];
        components?: {
            DropdownMenuItem?: ComponentType<MenuItemProps>;
            DropdownMenu?: ComponentType<MenuProps>;
        };
        offset?: number;
        isDisabled?: boolean;
        appendTo?: HTMLElement;
        hoverContent?: ReactNode;
        onToggle?: (isToggled: boolean) => void;
    };

interface DropdownRef {
    close: () => void;
    open: () => void;
}

type Coords = [number, number] | undefined;

const Dropdown = forwardRef(
    (
        {
            children,
            className,
            items,
            components,
            isDisabled,
            absolutePosition,
            alignMenu = 'left',
            offset = 10,
            appendTo,
            topPadding = 8,
            bottomPadding = 8,
            horizontalPadding = 0,
            minWidth = 140,
            onToggle,
            hoverContent,
            masterLink,
            ...rest
        }: DropdownProps,
        ref,
    ) => {
        const theme = useTheme();
        const [toggled, setToggledState] = useState(false);
        const [coords, setCoords] = useState<Coords>(undefined);
        const [menuSize, setMenuSize] = useState<Coords>(undefined);
        const menuRef = useRef<HTMLUListElement>(null);
        const toggleRef = useRef<any>(null);
        const MenuComponent = components?.DropdownMenu ?? Menu;
        const MenuItemComponent = components?.DropdownMenuItem ?? MenuItem;

        const visibleItems = items.map(group => ({
            ...group,
            options: group.options.filter(item => !item.isHidden),
        }));

        const setToggled = useCallback(
            (isToggled: boolean) => {
                if (onToggle) onToggle(isToggled);
                setToggledState(isToggled);
            },
            [onToggle],
        );

        useLayoutEffect(() => {
            if (menuRef.current && toggled) {
                const rect = menuRef.current.getBoundingClientRect();
                setMenuSize([rect.width, rect.height]);
            }
        }, [toggled]);

        useImperativeHandle(ref, () => ({
            close: () => {
                setToggled(false);
            },
        }));

        const setAdjustedCoords = (c: Coords) => {
            if (!c) {
                setCoords(c);
                return;
            }

            let x = c[0];
            const y = c[1];
            if (menuRef.current) {
                const rect = menuRef.current.getBoundingClientRect();
                x += rect.width;
            }

            setCoords([x, y]);
        };

        useOnClickOutside([menuRef, toggleRef], () => {
            if (toggled) {
                setToggled(false);
            }
        });

        const onMenuItemClick = (item: DropdownMenuItem) => {
            // Close the menu if item is not disabled and if
            // a) callback func is not defined
            // or
            // b) callback is defined and returns true/void
            if (!item.isDisabled) {
                if (item.callback) {
                    const shouldCloseMenu = item.callback();
                    if (shouldCloseMenu === true || shouldCloseMenu === undefined) {
                        setToggled(false);
                    }
                } else {
                    setToggled(false);
                }
            }
        };

        const toggleComponent = children ? (
            cloneElement(children, {
                ref: toggleRef,
                isDisabled,
                onClick: !isDisabled
                    ? (e: any) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (children.props.onClick) children.props.onClick(e);
                          setToggled(!toggled);
                          setAdjustedCoords([e.pageX, e.pageY]);
                      }
                    : undefined,
            })
        ) : (
            <MoreIcon
                ref={toggleRef}
                size={24}
                icon="MORE"
                color={!isDisabled ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY}
                $isDisabled={isDisabled}
                onClick={
                    !isDisabled
                        ? e => {
                              setToggled(!toggled);
                              setAdjustedCoords([e.pageX, e.pageY]);
                          }
                        : undefined
                }
                {...rest}
            />
        );

        const getIconComponent = (item: DropdownMenuItem) => {
            if (item.icon) {
                return typeof item.icon === 'string' ? (
                    <IconLeft>
                        <Icon icon={item.icon} size={16} color={theme.TYPE_DARK_GREY} />
                    </IconLeft>
                ) : (
                    item.icon
                );
            }
            return null;
        };

        const menu = (
            <MenuComponent
                ref={menuRef}
                alignMenu={alignMenu}
                menuSize={menuSize}
                offset={offset}
                coords={absolutePosition ? coords : undefined}
                topPadding={topPadding}
                bottomPadding={bottomPadding}
                horizontalPadding={horizontalPadding}
                minWidth={minWidth}
            >
                {masterLink && (
                    <MasterLinkComponent
                        topMargin={topPadding}
                        rightMargin={horizontalPadding}
                        onClick={() => {
                            if (masterLink.callback) {
                                masterLink.callback();
                                setToggled(false);
                            }
                        }}
                    >
                        <span>{masterLink.label}</span>
                        <MasterLinkComponentIcon
                            icon={masterLink.icon}
                            size={10}
                            color={theme.TYPE_GREEN}
                        />
                    </MasterLinkComponent>
                )}
                {visibleItems.map(group => (
                    <Fragment key={group.key}>
                        {group.label && <Group>{group.label}</Group>}
                        {group.options.map(item => (
                            <MenuItemComponent
                                onClick={e => {
                                    e.stopPropagation();
                                    onMenuItemClick(item);
                                }}
                                data-test={item['data-test']}
                                key={item.key}
                                item={item}
                            >
                                {getIconComponent(item)}
                                <MenuItemLabel>{item.label}</MenuItemLabel>
                                {item.iconRight && (
                                    <IconRight>
                                        <Icon
                                            icon={item.iconRight}
                                            size={16}
                                            color={theme.TYPE_DARK_GREY}
                                        />
                                    </IconRight>
                                )}
                            </MenuItemComponent>
                        ))}
                    </Fragment>
                ))}
            </MenuComponent>
        );

        const portalMenu = absolutePosition && appendTo ? createPortal(menu, appendTo) : menu;

        return (
            <Wrapper className={className} absolutePosition={!!absolutePosition}>
                {toggleComponent}
                {toggled && portalMenu}
            </Wrapper>
        );
    },
);

Dropdown.displayName = 'Dropdown';
export type {
    DropdownRef,
    DropdownProps,
    MenuItemProps as DropdownMenuItemProps,
    MenuProps as DropdownMenuProps,
};
export { Dropdown };
