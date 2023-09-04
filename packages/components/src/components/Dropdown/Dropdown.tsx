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
import { borders, boxShadows, spacings, spacingsPx, typography } from '@trezor/theme';
import { useOnClickOutside } from '@trezor/react-utils';
import { Z_INDEX } from '../../config/variables';
import { animations } from '../../config';
import { useTheme } from '../../utils/hooks';
import { Icon, IconProps } from '../assets/Icon/Icon';

const MasterLinkComponent = styled.button`
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    background: none;
    letter-spacing: 0.4px;
    color: ${({ theme }) => theme.textPrimaryDefault};
    text-transform: uppercase;
    border: 0;
    opacity: 0;
    cursor: pointer;
    transform: translateX(-10px);
    transition: transform 0.2s ease, opacity 0.2s ease;
    ${typography.label};

    :hover {
        opacity: 0.6 !important;
    }
`;

const Menu = styled.ul<Pick<MenuProps, 'coords' | 'alignMenu'>>`
    position: fixed;
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: ${spacingsPx.sm};
    min-width: 140px;
    border-radius: ${borders.radii.md};
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    box-shadow: ${boxShadows.elevation3};
    z-index: ${Z_INDEX.NAVIGATION_BAR};
    animation: ${animations.DROPDOWN_MENU} 0.15s ease-in-out;
    list-style-type: none;
    overflow: hidden;
    ${typography.hint}

    ${({ coords }) =>
        coords &&
        css`
            top: ${coords.y}px;
            left: ${coords.x}px;
        `}

    :hover ${MasterLinkComponent} {
        opacity: 1;
        transform: translateX(0);
    }
`;

const GroupLabel = styled.li`
    padding: ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.xxs};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    ${typography.label};
    cursor: default;

    :first-of-type {
        padding-top: ${spacingsPx.xxs};
    }
`;

type MenuItemsProps = Pick<
    DropdownMenuItem,
    'noPadding' | 'isDisabled' | 'noHover' | 'separatorBefore'
>;

const MenuItem = styled.li<MenuItemsProps>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${spacingsPx.sm};
    padding: ${({ noPadding }) => (!noPadding ? `${spacingsPx.xs} ${spacingsPx.sm}` : 0)};
    border-radius: ${borders.radii.xs};
    color: ${({ isDisabled, theme }) => (!isDisabled ? theme.textDefault : theme.textDisabled)};
    white-space: nowrap;
    transition: background 0.2s ease;
    cursor: pointer;

    > span {
        margin-right: auto;
    }

    :hover {
        background: ${({ theme }) => theme.backgroundSurfaceElevation2};
    }

    ${({ noHover, isDisabled }) =>
        (noHover || isDisabled) &&
        css`
            pointer-events: none;
            cursor: default;
        `}

    ${({ separatorBefore, theme }) =>
        separatorBefore &&
        css`
            margin-top: ${spacingsPx.md};

            :after {
                position: absolute;
                width: 100%;
                top: -${spacingsPx.xs};
                left: 0;
                border-top: 1px solid ${theme.borderOnElevation1};
                content: '';
            }
        `}
`;

const MoreIcon = styled(Icon)<{ $isDisabled?: boolean }>`
    transition: background 0.2s;
    border-radius: ${borders.radii.xs};

    :hover {
        background: ${({ $isDisabled, theme }) => !$isDisabled && theme.backgroundNeutralSubdued};
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
    icon?: IconProps['icon'];
    iconRight?: IconProps['icon'];
    isDisabled?: boolean;
    isHidden?: boolean;
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

interface MasterLink {
    label: React.ReactNode;
    icon: IconProps['icon'];
    callback?: () => void;
}

type MenuAlignment = 'left' | 'right' | 'top-left' | 'top-right';

export interface MenuProps {
    alignMenu?: MenuAlignment;
    coords?: Coords;
    masterLink?: MasterLink;
    className?: string;
}

export type DropdownProps = MenuProps & {
    items: GroupedMenuItems[];
    isDisabled?: boolean;
    renderOnClickPosition?: boolean;
    onToggle?: (isToggled: boolean) => void;
    children?: React.ReactElement<any>;
};

export interface DropdownRef {
    close: () => void;
    open: () => void;
}

export const Dropdown = forwardRef(
    (
        {
            items,
            isDisabled,
            renderOnClickPosition,
            masterLink,
            alignMenu = 'left',
            onToggle,
            className,
            children,
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

        const visibleItems = items.map(group => ({
            ...group,
            options: group.options.filter(item => !item.isHidden),
        }));

        const menu = (
            <Menu ref={menuRef} alignMenu={alignMenu} coords={coords}>
                {masterLink && (
                    <MasterLinkComponent
                        onClick={() => {
                            if (masterLink.callback) {
                                masterLink.callback();
                                setToggled(false);
                            }
                        }}
                    >
                        <span>{masterLink.label}</span>
                        <Icon icon={masterLink.icon} size={spacings.sm} color={theme.TYPE_GREEN} />
                    </MasterLinkComponent>
                )}
                {visibleItems.map(group => (
                    <React.Fragment key={group.key}>
                        {group.label && <GroupLabel>{group.label}</GroupLabel>}
                        {group.options.map(item => (
                            <MenuItem
                                onClick={e => {
                                    e.stopPropagation();
                                    onMenuItemClick(item);
                                }}
                                data-test={item['data-test']}
                                key={item.key}
                                isDisabled={item.isDisabled}
                                noPadding={item.noPadding}
                                noHover={item.noHover}
                                separatorBefore={item.separatorBefore}
                            >
                                {item.icon && <Icon icon={item.icon} size={spacings.md} />}
                                <span>{item.label}</span>
                                {item.iconRight && (
                                    <Icon icon={item.iconRight} size={spacings.md} />
                                )}
                            </MenuItem>
                        ))}
                    </React.Fragment>
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
