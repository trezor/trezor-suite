import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { DotsThreeIcon } from '@trezor/icons';

import { type FrameProps, type FramePropsKeys } from '../../utils/frameProps';
import { type IconComponent } from '../Icon/Icon';
import { type DropdownMenuItemProps, Menu, type MenuProps } from '../Menu/Menu';
import { Popover, type PopoverRef } from '../Popover/Popover';
import { type PopoverPlacement } from '../Popover/utils';
import { IconButton, type IconButtonProps } from '../buttons/IconButton/IconButton';
import { type ButtonSize } from '../buttons/types';

export const allowedDropdownFrameProps = ['width', 'minWidth'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedDropdownFrameProps)[number]>;

export type DropdownProps = Omit<MenuProps, 'onClose'> &
    AllowedFrameProps & {
        placement?: PopoverPlacement;
        isDisabled?: boolean;
        iconSize?: ButtonSize;
        isLoading?: boolean;
        icon?: IconComponent;
        intent?: IconButtonProps['intent'];
        priority?: IconButtonProps['priority'];
        tooltip?: IconButtonProps['tooltip'];
        'data-testid'?: string;
    };

export type DropdownRef = {
    close: () => void;
    open: () => void;
};

export type { DropdownMenuItemProps };

export const Dropdown = forwardRef(
    (
        {
            items,
            content,
            iconSize,
            isDisabled,
            isLoading,
            placement,
            icon = DotsThreeIcon,
            intent = 'neutral',
            priority = 'secondary',
            'data-testid': dataTest,
            minWidth,
            maxWidth,
            width,
            tooltip = { isActive: false },
        }: DropdownProps,
        ref,
    ) => {
        const popoverRef = useRef<PopoverRef>(null);
        const menuRef = useRef<HTMLUListElement>(null);

        // `Popover` fills `popoverRef` in during commit, and it owns the open state itself, so
        // opening the menu never re-renders this component. Reading the ref during render would
        // therefore hand `Menu` an `onClose` of `undefined` for as long as nothing else re-renders
        // the dropdown, and picking an item would not close the menu.
        const closeMenu = useCallback(() => popoverRef.current?.close(), []);

        useImperativeHandle(ref, () => ({
            close: () => {
                popoverRef.current?.close();
            },
            open: () => {
                popoverRef.current?.open();
            },
        }));

        return (
            <Popover
                ref={popoverRef}
                placement={placement}
                data-component="Dropdown"
                content={
                    <Menu
                        ref={menuRef}
                        items={items}
                        content={content}
                        onClose={closeMenu}
                        minWidth={minWidth}
                        width={width}
                        maxWidth={maxWidth}
                    />
                }
            >
                <IconButton
                    intent={intent}
                    priority={priority}
                    icon={icon}
                    size={iconSize}
                    tabIndex={-1}
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                    data-testid={dataTest}
                    tooltip={tooltip}
                />
            </Popover>
        );
    },
);
