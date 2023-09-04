import React, { forwardRef } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { borders, boxShadows, spacings, spacingsPx, typography } from '@trezor/theme';
import { Z_INDEX } from '../../config/variables';
import { animations } from '../../config';
import { Icon, IconProps } from '../assets/Icon/Icon';
import type { Coords } from './getAdjustedCoords';

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
    DropdownMenuItemProps,
    'isDisabled' | 'noHoverEffect' | 'separatorBefore'
>;

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

interface MasterLinkProps {
    label: React.ReactNode;
    icon: IconProps['icon'];
    setToggled: (toggled: boolean) => void;
    callback?: () => void;
}

const MasterLink = ({ label, icon, callback, setToggled }: MasterLinkProps) => {
    const theme = useTheme();

    return (
        <MasterLinkComponent
            onClick={() => {
                if (callback) {
                    callback();
                    setToggled(false);
                }
            }}
        >
            <span>{label}</span>
            <Icon icon={icon} size={spacings.sm} color={theme.iconPrimaryDefault} />
        </MasterLinkComponent>
    );
};

interface DropdownMenuItemProps {
    key: string;
    label: React.ReactNode;
    callback?: () => any | Promise<any>;
    icon?: IconProps['icon'];
    iconRight?: IconProps['icon'];
    isDisabled?: boolean;
    isHidden?: boolean;
    noHoverEffect?: boolean;
    separatorBefore?: boolean;
    'data-test'?: string;
}

const MenuItem = ({
    icon,
    iconRight,
    label,
    isDisabled,
    callback,
    setToggled,
    ...rest
}: DropdownMenuItemProps & { setToggled: (toggled: boolean) => void }) => {
    const onMenuItemClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Close the menu if item is not disabled and if
        // a) callback func is not defined
        // b) callback is defined and returns true/void
        if (!isDisabled) {
            if (callback) {
                const shouldCloseMenu = callback();
                if (shouldCloseMenu === true || shouldCloseMenu === undefined) {
                    setToggled(false);
                }
            } else {
                setToggled(false);
            }
        }
    };

    return (
        <MenuItemContainer onClick={onMenuItemClick} isDisabled={isDisabled} {...rest}>
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
    masterLink?: Omit<MasterLinkProps, 'setToggled'>;
    setToggled: (toggled: boolean) => void;
}

export const Menu = forwardRef<HTMLUListElement, MenuProps>(
    ({ items, content, setToggled, alignMenu, coords, masterLink }, ref) => {
        const visibleItems = items?.map(group => ({
            ...group,
            options: group.options.filter(item => !item.isHidden),
        }));

        return (
            <Container ref={ref} alignMenu={alignMenu} coords={coords}>
                {masterLink && <MasterLink setToggled={setToggled} {...masterLink} />}

                {content && content}

                {visibleItems &&
                    visibleItems.map(group => <Group setToggled={setToggled} {...group} />)}
            </Container>
        );
    },
);
