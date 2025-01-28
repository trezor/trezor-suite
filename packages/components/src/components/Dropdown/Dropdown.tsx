import {
    forwardRef,
    cloneElement,
    ReactElement,
    MouseEvent,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

import styled from 'styled-components';

import { useOnClickOutside } from '@trezor/react-utils';

import { Menu, MenuProps, DropdownMenuItemProps } from '../Menu/Menu';
import { IconButton } from '../buttons/IconButton/IconButton';
import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { Popover } from '../Popover/Popover';
import { PopoverPlacement } from '../Popover/utils';

export const allowedDropdownFrameProps = ['width'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedDropdownFrameProps)[number]>;

const MoreIcon = styled(IconButton)<{ $isToggled: boolean }>`
    background: ${({ isDisabled, $isToggled, theme }) =>
        !isDisabled && $isToggled && theme.backgroundNeutralSubdued};

    &:hover {
        background: ${({ theme, $isToggled }) => $isToggled && theme.backgroundNeutralSubdued};
    }
`;

export type DropdownProps = Omit<MenuProps, 'setToggled'> &
    AllowedFrameProps & {
        placement?: PopoverPlacement;
        isDisabled?: boolean;
        renderOnClickPosition?: boolean;
        onToggle?: (isToggled: boolean) => void;
        className?: string;
        'data-testid'?: string;
        children?: ((isToggled: boolean) => ReactElement<any>) | ReactElement<any>;
    };

export interface DropdownRef {
    close: () => void;
    open: () => void;
}

export type { DropdownMenuItemProps };

export const Dropdown = forwardRef(
    (
        {
            items,
            content,
            isDisabled,
            addon,
            placement,
            onToggle,
            children,
            'data-testid': dataTest,
        }: DropdownProps,
        ref,
    ) => {
        const [isToggled, setIsToggledState] = useState(false);

        const menuRef = useRef<HTMLUListElement>(null);
        const toggleRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (!isToggled) {
                toggleRef.current?.blur();
            }

            // focus the menu when it's toggled and there is content, not items
            if (isToggled && content) {
                menuRef.current?.focus();
            }
        }, [isToggled, content]);

        const setToggled = (isToggled2: boolean) => {
            if (onToggle) onToggle(isToggled2);
            setIsToggledState(isToggled2);
        };

        useImperativeHandle(ref, () => ({
            close: () => {
                setToggled(false);
            },
        }));

        useOnClickOutside([menuRef, toggleRef], () => {
            if (isToggled) {
                setToggled(false);
            }
        });

        const childComponent = typeof children === 'function' ? children(isToggled) : children;

        const ToggleComponent = childComponent ? (
            <div>
                {cloneElement(childComponent, {
                    isDisabled,
                    onClick: (e: MouseEvent) => {
                        childComponent?.props.onClick?.(e);
                    },
                })}
            </div>
        ) : (
            <MoreIcon
                size="small"
                variant="tertiary"
                icon="dotsThree"
                tabIndex={-1}
                $isToggled={isToggled}
                isDisabled={isDisabled}
                data-testid={dataTest}
            />
        );

        return (
            <Popover
                placement={placement}
                content={
                    <Menu items={items} content={content} setToggled={setToggled} addon={addon} />
                }
            >
                {ToggleComponent}
            </Popover>
        );
    },
);
