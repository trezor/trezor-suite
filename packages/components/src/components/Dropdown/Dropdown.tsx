import {
    useState,
    useRef,
    useLayoutEffect,
    forwardRef,
    useImperativeHandle,
    cloneElement,
    Ref,
    MouseEvent,
    RefObject,
    ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { borders } from '@trezor/theme';
import { useOnClickOutside } from '@trezor/react-utils';
import { useTheme } from '../../utils/hooks';
import { Icon } from '../assets/Icon/Icon';
import { Menu, MenuProps } from './Menu';
import { Coords, getAdjustedCoords } from './getAdjustedCoords';

const MoreIcon = styled(Icon)<{ $isDisabled?: boolean }>`
    transition: background 0.2s;
    border-radius: ${borders.radii.xs};
    cursor: ${({ $isDisabled }) => $isDisabled && 'default'};

    :hover {
        background: ${({ $isDisabled, theme }) => !$isDisabled && theme.backgroundNeutralSubdued};
    }
`;

const getPlacementData = (
    toggleRef: RefObject<HTMLElement>,
    menuRef: RefObject<HTMLUListElement>,
    clickPos: Coords | undefined,
) => {
    if (!toggleRef.current || !menuRef.current) {
        return {};
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
        return {};
    }

    return { coordsToUse, toggleDimentions };
};

export type DropdownProps = Omit<MenuProps, 'setToggled'> & {
    isDisabled?: boolean;
    renderOnClickPosition?: boolean;
    onToggle?: (isToggled: boolean) => void;
    className?: string;
    children?: ReactElement<any>;
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

        // when toggled, calculate the position of the menu
        // takes into account the toggle position, size and the menu alignment
        useLayoutEffect(() => {
            const { coordsToUse, toggleDimentions } = getPlacementData(
                toggleRef,
                menuRef,
                clickPos,
            );

            if (!coordsToUse || !menuRef.current) {
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

        const setToggled = (isToggled: boolean) => {
            if (onToggle) onToggle(isToggled);
            setToggledState(isToggled);
        };

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

        const PortalMenu = createPortal(
            <Menu
                ref={menuRef}
                items={items}
                coords={coords}
                setToggled={setToggled}
                alignMenu={alignMenu}
                masterLink={masterLink}
            />,
            document.body,
        );

        return (
            <div className={className}>
                {ToggleComponent}
                {toggled && PortalMenu}
            </div>
        );
    },
);
