import React, { useState, useRef } from 'react';
import styled, { css } from 'styled-components';
import { colors, variables } from '../../config';
import { useOnClickOutside } from '../../utils/hooks';
import { Icon, IconProps } from '../Icon';

const Wrapper = styled.div`
    position: relative;
`;

const Menu = styled.ul<MenuProps>`
    display: flex;
    flex-direction: column;
    position: absolute;
    border-radius: 4px;
    flex: 1;
    min-width: 140px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    z-index: 1;

    list-style-type: none;
    margin-top: ${props => (props.offset !== undefined ? `${props.offset}px` : '10px')};
    background: ${colors.NEUE_BG_WHITE};
    overflow: hidden;

    ${props =>
        props.alignMenu === 'left' &&
        css`
            left: 0px;
        `};

    ${props =>
        props.alignMenu === 'right' &&
        css`
            right: 0px;
        `};
`;

const Group = styled.li`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
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
        !props.item.isDisabled ? colors.NEUE_TYPE_DARK_GREY : colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ${props =>
        !props.item.isDisabled &&
        !props.item.noHover &&
        css`
            &:hover {
                background: ${colors.NEUE_BG_GRAY};
            }
        `}
`;

const DefaultTogglerIcon = styled(Icon)<Pick<Props, 'isDisabled'>>`
    cursor: ${props => (!props.isDisabled ? 'pointer' : 'default')};
`;

const IconWrapper = styled.div`
    margin-right: 16px;
`;

interface DropdownMenuItem {
    key: string;
    label: React.ReactNode;
    callback?: () => boolean | void;
    icon?: IconProps['icon'];
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
    alignMenu?: 'left' | 'right';
    offset?: number;
}

interface Props extends MenuProps, React.ButtonHTMLAttributes<HTMLDivElement> {
    children?: React.ReactElement<any>;
    items: GroupedMenuItems[];
    components?: {
        DropdownMenuItem?: React.ComponentType<MenuItemProps>;
        DropdownMenu?: React.ComponentType<MenuProps>;
    };
    offset?: number;
    isDisabled?: boolean;
}

const Dropdown = ({
    children,
    className,
    items,
    components,
    isDisabled,
    alignMenu = 'left',
    offset = 10,
    ...rest
}: Props) => {
    const [toggled, setToggled] = useState(false);
    const menuRef = useRef<HTMLUListElement>(null);
    const toggleRef = useRef<any>(null);
    const MenuComponent = components?.DropdownMenu ?? Menu;
    const MenuItemComponent = components?.DropdownMenuItem ?? MenuItem;

    const visibleItems = items.filter(group => ({
        ...group,
        options: group.options.filter(item => !item.isHidden),
    }));

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
                  }
                : undefined,
        })
    ) : (
        <DefaultTogglerIcon
            ref={toggleRef}
            size={24}
            icon="MORE"
            color={!isDisabled ? colors.NEUE_TYPE_DARK_GREY : colors.NEUE_TYPE_LIGHT_GREY}
            onClick={
                !isDisabled
                    ? () => {
                          setToggled(!toggled);
                      }
                    : undefined
            }
            isDisabled={isDisabled}
            {...rest}
        />
    );

    return (
        <Wrapper className={className}>
            {toggleComponent}
            {toggled && (
                <MenuComponent ref={menuRef} alignMenu={alignMenu} offset={offset}>
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
                                    {item.icon && (
                                        <IconWrapper>
                                            <Icon
                                                icon={item.icon}
                                                size={16}
                                                color={colors.NEUE_TYPE_DARK_GREY}
                                            />
                                        </IconWrapper>
                                    )}
                                    {item.label}
                                </MenuItemComponent>
                            ))}
                        </React.Fragment>
                    ))}
                </MenuComponent>
            )}
        </Wrapper>
    );
};

Dropdown.displayName = 'Dropdown';

export {
    Dropdown,
    Props as DropdownProps,
    MenuItemProps as DropdownMenuItemProps,
    MenuProps as DropdownMenuProps,
};
