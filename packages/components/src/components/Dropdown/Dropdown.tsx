import { forwardRef, useImperativeHandle, useRef } from 'react';

import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { IconName } from '../Icon/Icon';
import { DropdownMenuItemProps, Menu, MenuProps } from '../Menu/Menu';
import { Popover, PopoverRef } from '../Popover/Popover';
import { PopoverPlacement } from '../Popover/utils';
import { IconButton } from '../buttons/IconButton/IconButton';

export const allowedDropdownFrameProps = ['width'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedDropdownFrameProps)[number]>;

export type DropdownProps = Omit<MenuProps, 'onClose'> &
    AllowedFrameProps & {
        placement?: PopoverPlacement;
        isDisabled?: boolean;
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
            isDisabled,
            isLoading,
            placement,
            iconName = 'dotsThree',
            'data-testid': dataTest,
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
                onOpenChange={isOpen => {
                    // Focus the menu when it opens and there is content
                    if (isOpen && content && menuRef.current) {
                        menuRef.current.focus();
                    }
                }}
                content={
                    <Menu
                        ref={menuRef}
                        items={items}
                        content={content}
                        onClose={popoverRef.current?.close}
                    />
                }
            >
                <IconButton
                    size="small"
                    variant="tertiary"
                    icon={iconName}
                    tabIndex={-1}
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                    data-testid={dataTest}
                />
            </Popover>
        );
    },
);
