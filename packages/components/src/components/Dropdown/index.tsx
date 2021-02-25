import React, {
    useState,
    useRef,
    useLayoutEffect,
    forwardRef,
    useImperativeHandle,
    useEffect,
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

const Menu = styled.ul<MenuProps>`
    display: flex;
    flex-direction: column;
    position: absolute;
    border-radius: 4px;
    flex: 1;
    min-width: 140px;
    box-shadow: 0 1px 2px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
    z-index: 10001;
    padding: ${props => props.verticalPadding}px 0px;

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
    padding: ${props => (!props.item.noPadding ? '8px 16px' : '0px')};
    white-space: nowrap;
    cursor: ${props => (!props.item.isDisabled ? 'pointer' : 'default')};
    color: ${props =>
        !props.item.isDisabled ? props.theme.TYPE_DARK_GREY : props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ${props =>
        !props.item.isDisabled &&
        !props.item.noHover &&
        css`
            &:hover {
                background: ${props.theme.BG_WHITE_ALT_HOVER};
            }
        `}
`;

const IconWrapper = styled.div`
    margin-right: 16px;
`;

interface DropdownMenuItem {
    key: string;
    label: React.ReactNode;
    callback?: () => any | Promise<any>;
    icon?: IconProps['icon'] | JSX.Element;
    isDisabled?: boolean;
    isHidden?: boolean;
    noPadding?: boolean;
    noHover?: boolean;
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
interface MenuProps {
    alignMenu?: 'left' | 'right' | 'top-left' | 'top-right';
    coords?: Coords;
    menuSize?: Coords;
    offset?: number;
    verticalPadding?: number;
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
            verticalPadding = 8,
            onToggle,
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
                    <IconWrapper>
                        <Icon icon={item.icon} size={16} color={theme.TYPE_DARK_GREY} />
                    </IconWrapper>
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
            >
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
                                {item.label}
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
