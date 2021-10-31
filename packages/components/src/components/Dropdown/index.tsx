import React, {
    useState,
    useRef,
    useLayoutEffect,
    forwardRef,
    useImperativeHandle,
    useCallback,
} from 'react';
import ReactDOM from 'react-dom';
import styled, { css } from 'styled-components';
import { variables } from '../../config';
import { useOnClickOutside, useTheme } from '../../utils/hooks';
import { Icon, IconProps } from '../Icon';

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
    color: ${props => props.theme.TYPE_GREEN};
    font-weight: ${variables.FONT_WEIGHT.BOLD};
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
    box-shadow: 0 2px 7px 0 ${props => props.theme.BOX_SHADOW_BLACK_15},
        0 2px 3px 0 ${props => props.theme.BOX_SHADOW_BLACK_5};
    z-index: ${variables.Z_INDEX.DROPDOWN_MENU};
    padding: ${props => props.topPadding}px ${props => props.horizontalPadding}px
        ${props => props.bottomPadding}px;
    border-radius: 10px;

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
    background: ${props => props.theme.BG_WHITE};
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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 16px 16px 10px 16px;
    cursor: default;
`;

const MenuItem = styled.li<MenuItemProps>`
    display: flex;
    align-items: center;
    padding: ${props => (!props.item.noPadding ? '8px 16px' : '0px')};
    white-space: nowrap;
    cursor: ${props => (!props.item.isDisabled ? 'pointer' : 'default')};
    color: ${props =>
        !props.item.isDisabled ? props.theme.TYPE_DARK_GREY : props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    position: relative;
    transition: all 0.2s ease;

    ${props =>
        props.item.separatorBefore &&
        css`
            margin-top: 17px;
            &:after {
                position: absolute;
                width: calc(100% - 32px);
                top: -9px;
                left: 16px;
                content: '';
                border-top: 1px solid ${props.theme.STROKE_GREY};
            }
        `}

    ${props =>
        props.item.isRounded &&
        css`
            border-radius: 4px;
        `}

    ${props =>
        !props.item.isDisabled &&
        !props.item.noHover &&
        css`
            &:hover {
                background: ${props.theme.BG_WHITE_ALT_HOVER};
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

interface DropdownMenuItem {
    key: string;
    label: React.ReactNode;
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

interface GroupedMenuItems {
    key: string;
    options: DropdownMenuItem[];
    label?: React.ReactNode;
}

interface MenuItemProps {
    item: DropdownMenuItem;
}

interface MasterLink {
    label: React.ReactNode;
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

interface Props extends MenuProps, React.ButtonHTMLAttributes<HTMLDivElement> {
    children?: React.ReactElement<any>;
    absolutePosition?: boolean;
    items: GroupedMenuItems[];
    components?: {
        DropdownMenuItem?: React.ComponentType<MenuItemProps>;
        DropdownMenu?: React.ComponentType<MenuProps>;
    };
    offset?: number;
    isDisabled?: boolean;
    appendTo?: HTMLElement;
    hoverContent?: React.ReactNode;
    onToggle?: (isToggled: boolean) => void;
}

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
        }: Props,
        ref
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
            [onToggle]
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

        useOnClickOutside([menuRef, toggleRef], event => {
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
            React.cloneElement(children, {
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
            <Icon
                ref={toggleRef}
                size={24}
                icon="MORE"
                color={!isDisabled ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY}
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
                {visibleItems.map((group, i) => (
                    <React.Fragment key={group.key}>
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
                    </React.Fragment>
                ))}
            </MenuComponent>
        );

        const portalMenu =
            absolutePosition && appendTo ? ReactDOM.createPortal(menu, appendTo) : menu;

        return (
            <Wrapper className={className} absolutePosition={!!absolutePosition}>
                {toggleComponent}
                {toggled && portalMenu}
            </Wrapper>
        );
    }
);

Dropdown.displayName = 'Dropdown';

export {
    Dropdown,
    DropdownRef,
    Props as DropdownProps,
    MenuItemProps as DropdownMenuItemProps,
    MenuProps as DropdownMenuProps,
};
