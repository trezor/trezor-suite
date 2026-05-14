import { forwardRef, useImperativeHandle, useRef } from 'react';

import { type FrameProps, type FramePropsKeys } from '../../utils/frameProps';
import { type IconName } from '../Icon/Icon';
import { type DropdownMenuItemProps, Menu, type MenuProps } from '../Menu/Menu';
import { Popover, type PopoverRef } from '../Popover/Popover';
import { type PopoverPlacement } from '../Popover/utils';
import { IconButton } from '../buttons/IconButton/IconButton';
import { type ButtonSize } from '../buttons/types';

export const allowedDropdownFrameProps = ['width', 'minWidth'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedDropdownFrameProps)[number]>;

export type DropdownProps = Omit<MenuProps, 'onClose'> &
    AllowedFrameProps & {
        placement?: PopoverPlacement;
        isDisabled?: boolean;
        iconSize?: ButtonSize;
        isLoading?: boolean;
        iconName?: IconName;
        className?: string;
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
            iconName = 'dotsThree',
            'data-testid': dataTest,
            minWidth,
            maxWidth,
            width,
        }: DropdownProps,
        ref,
    ) => {
        const popoverRef = useRef<PopoverRef>(null);
        const menuRef = useRef<HTMLUListElement>(null);

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
                content={
                    <Menu
                        ref={menuRef}
                        items={items}
                        content={content}
                        onClose={popoverRef.current?.close}
                        minWidth={minWidth}
                        width={width}
                        maxWidth={maxWidth}
                    />
                }
            >
                <IconButton
                    intent="neutral"
                    priority="secondary"
                    icon={iconName}
                    size={iconSize}
                    tabIndex={-1}
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                    data-testid={dataTest}
                />
            </Popover>
        );
    },
);
