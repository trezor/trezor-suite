import React, { forwardRef, useEffect, useState } from 'react';
import styled, { css, keyframes, useTheme } from 'styled-components';
import { borders, spacings, spacingsPx, typography } from '@trezor/theme';
import { Icon, IconProps } from '../assets/Icon/Icon';
import type { Coords } from './getAdjustedCoords';
import { menuStyle } from './menuStyle';
import { Elevation, mapElevationToBackground, nextElevation } from '@trezor/theme/src/elevation';
import { useElevation } from '../ElevationContext/ElevationContext';

const addonAnimation = keyframes`
    from {
        transform: translateX(-10px);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
`;

const AddonContainer = styled.div<{ isFocused?: boolean }>`
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    padding: ${spacingsPx.xxxs} ${spacingsPx.xs};
    background: ${({ theme, isFocused }) =>
        isFocused ? theme.backgroundSurfaceElevation0 : 'none'};
    letter-spacing: 0.4px;
    color: ${({ theme }) => theme.textPrimaryDefault};
    text-transform: uppercase;
    border: 0;
    opacity: ${({ isFocused }) => isFocused && 0.6} !important;
    cursor: pointer;
    transform: translateX(-10px);
    transition:
        transform 0.2s,
        opacity 0.2s,
        background 0.2s;
    animation: ${addonAnimation} 0.2s both;
    ${typography.label};
`;

const Container = styled.ul<Pick<MenuProps, 'coords' | 'alignMenu'> & { elevation: Elevation }>`
    position: fixed;
    ${menuStyle};

    ${({ coords }) =>
        coords &&
        css`
            top: ${coords.y}px;
            left: ${coords.x}px;
        `}
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

type MenuItemsProps = Pick<DropdownMenuItemProps, 'isDisabled' | 'separatorBefore'> & {
    noHoverEffect: boolean;
    isFocused: boolean;
};

const MenuItemContainer = styled.li<MenuItemsProps & { elevation: Elevation }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${spacingsPx.sm};
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    border-radius: ${borders.radii.xxs};
    background: ${({ isFocused, noHoverEffect, theme, elevation }) =>
        isFocused && !noHoverEffect
            ? theme[mapElevationToBackground[nextElevation[elevation]]]
            : undefined};
    color: ${({ isDisabled, theme }) => (!isDisabled ? theme.textDefault : theme.textDisabled)};
    white-space: nowrap;
    transition: background 0.2s ease;
    pointer-events: ${({ isDisabled }) => (isDisabled ? 'none' : 'auto')};
    cursor: ${({ noHoverEffect }) => (noHoverEffect ? 'default' : 'pointer')};

    > span {
        margin-right: auto;
    }

    ${({ separatorBefore, theme }) =>
        separatorBefore &&
        css`
            margin-top: ${spacingsPx.md};

            ::after {
                position: absolute;
                width: 100%;
                top: -${spacingsPx.xs};
                left: 0;
                border-top: 1px solid ${theme.borderOnElevation1};
                content: '';
            }
        `}
`;

interface AddonProps {
    label: React.ReactNode;
    icon: IconProps['icon'];
    onClick?: () => void;
}

interface AddonComponentProps extends AddonProps {
    isKeyboardSelected: boolean;
    onMouseOver: () => void;
}

const Addon = ({ label, icon, onClick, isKeyboardSelected, onMouseOver }: AddonComponentProps) => {
    const theme = useTheme();

    return (
        <AddonContainer onClick={onClick} isFocused={isKeyboardSelected} onMouseOver={onMouseOver}>
            <span>{label}</span>
            <Icon icon={icon} size={spacings.sm} color={theme.iconPrimaryDefault} />
        </AddonContainer>
    );
};

export interface DropdownMenuItemProps {
    key: string;
    label: React.ReactNode;
    onClick?: () => any | Promise<any>;
    shouldCloseOnClick?: boolean;
    icon?: IconProps['icon'];
    iconRight?: IconProps['icon'];
    isDisabled?: boolean;
    isHidden?: boolean;
    separatorBefore?: boolean;
    'data-test'?: string;
}

interface MenuItemComponentProps extends DropdownMenuItemProps {
    isKeyboardSelected: boolean;
    setToggled: (toggled: boolean) => void;
    onMouseOver: () => void;
}

const MenuItem = ({
    icon,
    iconRight,
    label,
    isDisabled,
    onClick,
    shouldCloseOnClick = true,
    setToggled,
    isKeyboardSelected,
    onMouseOver,
    ...rest
}: MenuItemComponentProps) => {
    const { elevation } = useElevation();

    const onMenuItemClick = () => {
        if (isDisabled) {
            return;
        }

        onClick?.();
        if (shouldCloseOnClick) {
            setToggled(false);
        }
    };

    return (
        <MenuItemContainer
            elevation={elevation}
            onClick={onMenuItemClick}
            isDisabled={isDisabled}
            noHoverEffect={!onClick}
            isFocused={isKeyboardSelected}
            onMouseOver={onMouseOver}
            {...rest}
        >
            {icon && <Icon icon={icon} size={spacings.md} />}
            <span>{label}</span>
            {iconRight && <Icon icon={iconRight} size={spacings.md} />}
        </MenuItemContainer>
    );
};

export interface GroupedMenuItems {
    key: string;
    options: DropdownMenuItemProps[];
    label?: React.ReactNode;
}

interface GroupComponentProps extends GroupedMenuItems {
    index: number;
    keyboardFocusedItemId: string | undefined;
    setToggled: (toggled: boolean) => void;
    handleItemHover: (itemId: string) => void;
}

const Group = ({
    options,
    index,
    keyboardFocusedItemId,
    label,
    setToggled,
    handleItemHover,
}: GroupComponentProps) => (
    <>
        {label && <GroupLabel>{label}</GroupLabel>}

        {options.map((item, itemIndex) => {
            const itemId = `${index}.${itemIndex}`;

            return (
                <MenuItem
                    setToggled={setToggled}
                    isKeyboardSelected={itemId === keyboardFocusedItemId}
                    onMouseOver={() => !item.isDisabled && handleItemHover(itemId)}
                    {...item}
                />
            );
        })}
    </>
);

const getNextIndex =
    (keyboardKey: string, flatGroupItems: Array<{ id: string; isDisabled?: boolean }>) =>
    (currentIndex: number | null) => {
        if (currentIndex === null) {
            return null;
        }

        let nextIndex = currentIndex;
        const lastIndex = flatGroupItems.length - 1;

        if (keyboardKey === 'ArrowUp') {
            const getPrevIndex = (current: number) => (current > 0 ? current - 1 : lastIndex);
            nextIndex = getPrevIndex(nextIndex);
            // skip disabled items
            while (flatGroupItems[nextIndex].isDisabled) {
                nextIndex = getPrevIndex(nextIndex);
            }
        } else if (keyboardKey === 'ArrowDown') {
            const getNextIndex = (current: number) => (current < lastIndex ? current + 1 : 0);
            nextIndex = getNextIndex(nextIndex);
            // skip disabled items
            while (flatGroupItems[nextIndex].isDisabled) {
                nextIndex = getNextIndex(nextIndex);
            }
        }

        return nextIndex;
    };

type FlatGroupItems = Array<{
    id: string;
    shouldCloseOnClick?: boolean;
    onClick?: () => void;
    isDisabled?: boolean;
}>;

const flattenVisibleItems = (visibleItems: MenuProps['items'], addon: MenuProps['addon']) => {
    const flatGroupItems = visibleItems?.reduce((ids, group, groupIndex) => {
        const groupIds = group.options.map(
            ({ shouldCloseOnClick, onClick, isDisabled }, index) => ({
                id: `${groupIndex}.${index}`,
                onClick,
                shouldCloseOnClick,
                isDisabled,
            }),
        );

        return [...ids, ...groupIds];
    }, [] as FlatGroupItems);

    if (addon) {
        flatGroupItems?.unshift({ id: 'addon' });
    }

    return flatGroupItems;
};

const getDefaultFocusItemIndex = (items: MenuProps['items'], addon: MenuProps['addon']) => {
    if (items?.length) {
        return addon ? 1 : 0;
    }

    return null;
};

export type MenuAlignment =
    | 'bottom-left'
    | 'bottom-right'
    | 'left-bottom'
    | 'left-top'
    | 'right-bottom'
    | 'right-top'
    | 'top-left'
    | 'top-right';

export interface MenuProps {
    items?: GroupedMenuItems[];
    content?: React.ReactNode;
    /**
     * @description first word is position of the dropdown from the toggle icon, the second one is an alignment on the dropdown itself related to this toggle icon
     */
    alignMenu?: MenuAlignment;
    offsetX?: number;
    offsetY?: number;
    coords?: Coords;
    addon?: Omit<AddonProps, 'setToggled'>;
    setToggled: (toggled: boolean) => void;
}

export const Menu = forwardRef<HTMLUListElement, MenuProps>(
    ({ items, content, setToggled, alignMenu, coords, addon }, ref) => {
        const { elevation } = useElevation();

        const [focusedItemIndex, setFocusedItemIndex] = useState(
            getDefaultFocusItemIndex(items, addon),
        );

        const visibleItems = items?.map(group => ({
            ...group,
            options: group.options.filter(item => !item.isHidden),
        }));

        const flatGroupItems = flattenVisibleItems(visibleItems, addon);

        // handle selecting an item
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (!flatGroupItems || !flatGroupItems.length || focusedItemIndex === null) {
                    return;
                }

                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();

                    const focusedItem = flatGroupItems[focusedItemIndex];
                    if (focusedItem.id === 'addon') {
                        addon?.onClick?.();
                    } else {
                        focusedItem?.onClick?.();
                    }

                    if (focusedItem.shouldCloseOnClick !== false) {
                        setToggled(false);
                    }
                }
            };

            if (focusedItemIndex !== null && flatGroupItems?.length) {
                document.addEventListener('keydown', handleKeyDown);

                return () => {
                    document.removeEventListener('keydown', handleKeyDown);
                };
            }
        }, [focusedItemIndex, flatGroupItems, setToggled, addon]);

        // handle keyboard navigation
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (
                    (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
                    flatGroupItems &&
                    flatGroupItems.length > 0 &&
                    focusedItemIndex !== null
                ) {
                    e.preventDefault();
                    setFocusedItemIndex(getNextIndex(e.key, flatGroupItems));
                }
            };

            if (focusedItemIndex !== null && flatGroupItems?.length) {
                document.addEventListener('keydown', handleKeyDown);

                return () => {
                    document.removeEventListener('keydown', handleKeyDown);
                };
            }
        }, [flatGroupItems, focusedItemIndex]);

        const handleItemHover = (itemId: string) => {
            const itemIndex = flatGroupItems?.findIndex(({ id }) => id === itemId);

            setFocusedItemIndex(itemIndex ?? null);
        };

        const handleAddonClick = () => {
            if (addon?.onClick) {
                addon?.onClick();
                setToggled(false);
            }
        };

        const keyboardFocusedItemId =
            focusedItemIndex !== null ? flatGroupItems?.[focusedItemIndex]?.id : undefined;

        return (
            <Container
                elevation={elevation}
                ref={ref}
                alignMenu={alignMenu}
                coords={coords}
                tabIndex={content ? 0 : 1} // do not affect tab order when there is no content
                onClick={e => e.stopPropagation()} // prevent closing the menu when clicking on the menu itself or within the menu
            >
                {addon && (
                    <Addon
                        onMouseOver={() => handleItemHover('addon')}
                        isKeyboardSelected={keyboardFocusedItemId === 'addon'}
                        {...addon}
                        onClick={handleAddonClick}
                    />
                )}

                {content}

                {visibleItems?.map((group, index) => (
                    <Group
                        setToggled={setToggled}
                        index={index}
                        keyboardFocusedItemId={keyboardFocusedItemId}
                        handleItemHover={handleItemHover}
                        {...group}
                    />
                ))}
            </Container>
        );
    },
);
