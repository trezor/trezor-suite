import React, { useState, useRef } from 'react';
import styled, { css } from 'styled-components';
import { colors, variables } from '../../config';
import { useOnClickOutside } from '../../utils/hooks';
import { Icon } from '../Icon';

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

const MenuItem = styled.li<Pick<DropdownMenuItem, 'isDisabled' | 'noPadding'>>`
    padding: ${props => (!props.noPadding ? '10px 16px' : '0px')};
    white-space: nowrap;
    cursor: ${props => (!props.isDisabled ? 'pointer' : 'default')};
    color: ${props =>
        !props.isDisabled ? colors.NEUE_TYPE_DARK_GREY : colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ${props =>
        !props.isDisabled &&
        css`
            &:hover {
                background: ${colors.NEUE_BG_GRAY};
            }
        `}
`;

const DefaultTogglerIcon = styled(Icon)<Pick<Props, 'isDisabled'>>`
    cursor: ${props => (!props.isDisabled ? 'pointer' : 'default')};
`;

interface DropdownMenuItem {
    label: React.ReactNode;
    callback: () => void;
    icon?: React.ReactNode;
    isDisabled?: boolean;
    isHidden?: boolean;
    noPadding?: boolean;
    'data-test'?: string;
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
    items: DropdownMenuItem[];
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
}: Props) => {
    const [toggled, setToggled] = useState(false);
    const menuRef = useRef<HTMLUListElement>(null);
    const toggleRef = useRef<any>(null);
    const MenuComponent = components?.DropdownMenu ?? Menu;
    const MenuItemComponent = components?.DropdownMenuItem ?? MenuItem;

    const visibleItems = items.filter(item => !item.isHidden);

    useOnClickOutside([menuRef, toggleRef], event => {
        if (toggled) {
            setToggled(false);
        }
    });

    const onMenuItemClick = (item: DropdownMenuItem) => {
        if (!item.isDisabled) {
            item.callback();
            setToggled(false);
        }
    };

    const toggleComponent = children ? (
        React.cloneElement(children, {
            ref: toggleRef,
            isDisabled,
            onClick: !isDisabled
                ? (e: any) => {
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
        />
    );

    return (
        <Wrapper className={className}>
            {toggleComponent}
            {toggled && (
                <MenuComponent ref={menuRef} alignMenu={alignMenu} offset={offset}>
                    {visibleItems.map(item => (
                        <MenuItemComponent
                            onClick={() => onMenuItemClick(item)}
                            isDisabled={item.isDisabled}
                            data-test={item['data-test']}
                            noPadding={item.noPadding}
                            item={item}
                        >
                            {item.label}
                        </MenuItemComponent>
                    ))}
                </MenuComponent>
            )}
        </Wrapper>
    );
};

Dropdown.displayName = 'Dropdown';

export { Dropdown, Props as DropdownProps };
