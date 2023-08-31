import {
    useState,
    useRef,
    useLayoutEffect,
    forwardRef,
    useImperativeHandle,
    useCallback,
    cloneElement,
    Ref,
    MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import { useOnClickOutside } from '@trezor/react-utils';
import { FONT_WEIGHT, Z_INDEX, FONT_SIZE } from '../../config/variables';
import { animations } from '../../config';
import { useTheme } from '../../utils/hooks';
import { Icon, IconProps } from '../assets/Icon/Icon';

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
    position: fixed;
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

    ${({ coords }) =>
        coords &&
        css`
            top: ${coords.y}px;
            left: ${coords.x}px;
        `}

    list-style-type: none;
    background: ${({ theme }) => theme.BG_WHITE};
    overflow: hidden;

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

type Coords = { x: number; y: number };
type Dimensions = { width: number; height: number };

const getAdjustedCoords = (
    coords: Coords,
    alignMenu: MenuAlignment,
    menuDimentions: Dimensions,
    toggleDimentions?: Dimensions,
): Coords | undefined => {
    if (!coords) {
        return;
    }

    let { x, y } = coords;
    const { width, height } = menuDimentions;
    const OFFSET = 4;

    switch (alignMenu) {
        case 'top-right':
            x -= width;
            y -= height;
            if (toggleDimentions) {
                x += toggleDimentions.width + OFFSET;
                y -= OFFSET;
            }
            break;
        case 'top-left':
            y -= height;

            if (toggleDimentions) {
                x -= OFFSET;
                y -= OFFSET;
            }
            break;
        case 'right':
            x -= width;
            if (toggleDimentions) {
                x += toggleDimentions.width + OFFSET;
                y += toggleDimentions.height + OFFSET;
            }
            break;
        case 'left':
        default:
            if (toggleDimentions) {
                x -= OFFSET;
                y += toggleDimentions.height + OFFSET;
            }
    }

    return { x, y };
};

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

export interface GroupedMenuItems {
    key: string;
    options: DropdownMenuItem[];
    label?: React.ReactNode;
}

export interface MenuItemProps {
    item: DropdownMenuItem;
}

interface MasterLink {
    label: React.ReactNode;
    icon: IconProps['icon'];
    callback?: () => void;
}

type MenuAlignment = 'left' | 'right' | 'top-left' | 'top-right';

export interface MenuProps {
    alignMenu?: MenuAlignment;
    coords?: Coords;
    offset?: number;
    topPadding?: number;
    bottomPadding?: number;
    horizontalPadding?: number;
    borderRadius?: number;
    minWidth?: number;
    masterLink?: MasterLink;
    className?: string;
}

export type DropdownProps = MenuProps & {
    children?: React.ReactElement<any>;
    renderOnClickPosition?: boolean;
    items: GroupedMenuItems[];
    isDisabled?: boolean;
    appendTo?: HTMLElement;
    onToggle?: (isToggled: boolean) => void;
};

export interface DropdownRef {
    close: () => void;
    open: () => void;
}

export const Dropdown = forwardRef(
    (
        {
            children,
            className,
            items,
            isDisabled,
            renderOnClickPosition,
            alignMenu = 'left',
            appendTo,
            topPadding = 8,
            bottomPadding = 8,
            horizontalPadding = 0,
            minWidth = 140,
            onToggle,
            masterLink,
            ...rest
        }: DropdownProps,
        ref,
    ) => {
        const [toggled, setToggledState] = useState(false);
        const [coords, setCoords] = useState<Coords>();
        const [clickPos, setclickPos] = useState<Coords>();

        const theme = useTheme();
        const menuRef = useRef<HTMLUListElement>(null);
        const toggleRef = useRef<HTMLElement>(null);

        useLayoutEffect(() => {
            if (!toggleRef.current || !menuRef.current) {
                return;
            }

            let coordsToUse: Coords;
            let toggleDimentions;
            if (clickPos) {
                coordsToUse = clickPos;
            } else {
                const { x, y, width, height } = toggleRef.current.getBoundingClientRect();

                coordsToUse = { x, y };
                toggleDimentions = { width, height };
            }

            if (!coordsToUse) {
                return;
            }

            const { width, height } = menuRef.current?.getBoundingClientRect();

            const adjustedCoords = getAdjustedCoords(
                coordsToUse,
                alignMenu,
                { width, height },
                toggleDimentions,
            );

            setCoords(adjustedCoords);
        }, [toggled, clickPos, alignMenu]);

        const setToggled = useCallback(
            (isToggled: boolean) => {
                if (onToggle) onToggle(isToggled);
                setToggledState(isToggled);
            },
            [onToggle],
        );

        useImperativeHandle(ref, () => ({
            close: () => {
                setToggled(false);
            },
        }));

        useOnClickOutside([menuRef, toggleRef], () => {
            if (toggled) {
                setToggled(false);
            }
        });

        const onMenuItemClick = (item: DropdownMenuItem) => {
            // Close the menu if item is not disabled and if
            // a) callback func is not defined
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

        const onToggleClick = (e: MouseEvent) => {
            if (isDisabled) {
                return;
            }

            setToggled(!toggled);
            if (renderOnClickPosition) {
                setclickPos({ x: e.pageX, y: e.pageY });
            }
        };

        const ToggleComponent = children ? (
            cloneElement(children, {
                ref: toggleRef,
                isDisabled,
                onClick: (e: MouseEvent): void => {
                    e.stopPropagation();
                    e.preventDefault();
                    children.props.onClick?.(e);
                    onToggleClick(e);
                },
            })
        ) : (
            <MoreIcon
                ref={toggleRef as Ref<HTMLDivElement>}
                size={24}
                icon="MORE"
                color={!isDisabled ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY}
                $isDisabled={isDisabled}
                onClick={onToggleClick}
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

        const visibleItems = items.map(group => ({
            ...group,
            options: group.options.filter(item => !item.isHidden),
        }));

        const menu = (
            <Menu
                ref={menuRef}
                alignMenu={alignMenu}
                coords={coords}
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
                    <div key={group.key}>
                        {group.label && <Group>{group.label}</Group>}
                        {group.options.map(item => (
                            <MenuItem
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
                            </MenuItem>
                        ))}
                    </div>
                ))}
            </Menu>
        );

        const PortalMenu = createPortal(menu, document.body);

        return (
            <div className={className}>
                {ToggleComponent}
                {toggled && PortalMenu}
            </div>
        );
    },
);
