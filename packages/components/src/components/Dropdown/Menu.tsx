import React, { forwardRef } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { borders, boxShadows, spacings, spacingsPx, typography } from '@trezor/theme';
import { Z_INDEX } from '../../config/variables';
import { animations } from '../../config';
import { Icon, IconProps } from '../assets/Icon/Icon';
import type { Coords } from './getAdjustedCoords';

const AddonConteiner = styled.button`
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

const Container = styled.ul<Pick<MenuProps, 'coords' | 'alignMenu'>>`
    position: fixed;
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: ${spacingsPx.sm};
    min-width: 140px;
    border-radius: ${borders.radii.md};
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    box-shadow: ${boxShadows.elevation3};
    z-index: ${Z_INDEX.MODAL};
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

    :hover ${AddonConteiner} {
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

type MenuItemsProps = Pick<DropdownMenuItemProps, 'isDisabled' | 'separatorBefore'> & {
    noHoverEffect: boolean;
};

const MenuItemContainer = styled.li<MenuItemsProps>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${spacingsPx.sm};
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    border-radius: ${borders.radii.xs};
    color: ${({ isDisabled, theme }) => (!isDisabled ? theme.textDefault : theme.textDisabled)};
    white-space: nowrap;
    transition: background 0.2s ease;
    pointer-events: ${({ isDisabled }) => (isDisabled ? 'none' : 'auto')};
    cursor: ${({ noHoverEffect }) => (noHoverEffect ? 'default' : 'pointer')};

    > span {
        margin-right: auto;
    }

    :hover {
        background: ${({ theme, noHoverEffect }) =>
            !noHoverEffect && theme.backgroundSurfaceElevation0};
    }

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

interface AddonProps {
    label: React.ReactNode;
    icon: IconProps['icon'];
    setToggled: (toggled: boolean) => void;
    onClick?: () => void;
}

const Addon = ({ label, icon, onClick, setToggled }: AddonProps) => {
    const theme = useTheme();

    const handleAddonClick = () => {
        if (onClick) {
            onClick();
            setToggled(false);
        }
    };

    return (
        <AddonConteiner onClick={handleAddonClick}>
            <span>{label}</span>
            <Icon icon={icon} size={spacings.sm} color={theme.iconPrimaryDefault} />
        </AddonConteiner>
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

const MenuItem = ({
    icon,
    iconRight,
    label,
    isDisabled,
    onClick,
    shouldCloseOnClick = true,
    setToggled,
    ...rest
}: DropdownMenuItemProps & { setToggled: (toggled: boolean) => void }) => {
    const onMenuItemClick = (e: React.MouseEvent) => {
        e.stopPropagation();
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
            onClick={onMenuItemClick}
            isDisabled={isDisabled}
            noHoverEffect={!onClick}
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

const Group = ({
    label,
    options,
    setToggled,
}: GroupedMenuItems & { setToggled: (toggled: boolean) => void }) => (
    <>
        {label && <GroupLabel>{label}</GroupLabel>}

        {options.map(item => (
            <MenuItem setToggled={setToggled} {...item} />
        ))}
    </>
);

export type MenuAlignment = 'left' | 'right' | 'top-left' | 'top-right';

export interface MenuProps {
    items?: GroupedMenuItems[];
    content?: React.ReactNode;
    alignMenu?: MenuAlignment;
    coords?: Coords;
    addon?: Omit<AddonProps, 'setToggled'>;
    setToggled: (toggled: boolean) => void;
}

export const Menu = forwardRef<HTMLUListElement, MenuProps>(
    ({ items, content, setToggled, alignMenu, coords, addon }, ref) => {
        const visibleItems = items?.map(group => ({
            ...group,
            options: group.options.filter(item => !item.isHidden),
        }));

        return (
            <Container ref={ref} alignMenu={alignMenu} coords={coords}>
                {addon && <Addon setToggled={setToggled} {...addon} />}

                {content && content}

                {visibleItems &&
                    visibleItems.map(group => <Group setToggled={setToggled} {...group} />)}
            </Container>
        );
    },
);
