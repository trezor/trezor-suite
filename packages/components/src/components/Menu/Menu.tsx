import React, { forwardRef, useEffect, useState } from 'react';

import styled from 'styled-components';

import { borders, spacings, spacingsPx, typography } from '@trezor/theme';

import { menuStyle } from './menuStyle';
import { Box } from '../Box/Box';
import { ElevationUp } from '../ElevationContext/ElevationContext';
import { Column, Row } from '../Flex/Flex';
import { Icon, IconName } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';

const Container = styled.div`
    ${menuStyle};
`;

const GroupLabel = styled.li`
    padding: ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.xxs};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    ${typography.label};
    cursor: default;

    :first-of-type {
        padding-top: ${spacingsPx.xxs};
    }
`;

export type DropdownMenuItemProps = {
    label: React.ReactNode;
    onClick?: () => any | Promise<any>;
    icon?: IconName;
    iconRight?: IconName;
    isDisabled?: boolean;
    isHidden?: boolean;
    'data-testid'?: string;
};

type MenuItemComponentProps = DropdownMenuItemProps & {
    isKeyboardSelected: boolean;
    setToggled: (toggled: boolean) => void;
    onMouseEnter: () => void;
};

const MenuItem = ({
    icon,
    iconRight,
    label,
    isDisabled,
    onClick,
    isKeyboardSelected,
    onMouseEnter,
    'data-testid': dataTest,
}: MenuItemComponentProps) => (
    <Box
        cursor={isDisabled ? 'default' : 'pointer'}
        hasBackground={isKeyboardSelected}
        borderRadius={borders.radii.xs}
        data-testid={dataTest}
        as="li"
        onClick={isDisabled ? undefined : onClick}
        onMouseEnter={onMouseEnter}
    >
        <Row gap={spacings.sm} padding={{ vertical: spacings.xs, horizontal: spacings.sm }}>
            {icon && (
                <Icon
                    name={icon}
                    size={spacings.md}
                    variant={isDisabled ? 'disabled' : 'default'}
                />
            )}
            <Text variant={isDisabled ? 'disabled' : 'default'} textWrap="nowrap">
                {label}
            </Text>
            {iconRight && (
                <Icon
                    margin={{ left: 'auto' }}
                    name={iconRight}
                    size={spacings.md}
                    variant={isDisabled ? 'disabled' : 'default'}
                />
            )}
        </Row>
    </Box>
);

export type GroupedMenuItems = {
    key: string;
    options: DropdownMenuItemProps[];
    label?: React.ReactNode;
};

type GroupComponentProps = GroupedMenuItems & {
    index: number;
    keyboardFocusedItemId: string | undefined;
    setToggled: (toggled: boolean) => void;
    handleItemHover: (itemId: string) => void;
};

const Group = ({
    options,
    index,
    keyboardFocusedItemId,
    label,
    setToggled,
    handleItemHover,
}: GroupComponentProps) => (
    <div>
        {label && <GroupLabel>{label}</GroupLabel>}

        {options.map((item, itemIndex) => {
            const itemId = `${index}.${itemIndex}`;

            return (
                <MenuItem
                    setToggled={setToggled}
                    isKeyboardSelected={itemId === keyboardFocusedItemId}
                    onMouseEnter={() => !item.isDisabled && handleItemHover(itemId)}
                    data-testid={item['data-testid']}
                    {...item}
                    key={itemId}
                />
            );
        })}
    </div>
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
            const getNextIndex2 = (current: number) => (current < lastIndex ? current + 1 : 0);
            nextIndex = getNextIndex2(nextIndex);
            // skip disabled items
            while (flatGroupItems[nextIndex].isDisabled) {
                nextIndex = getNextIndex2(nextIndex);
            }
        }

        return nextIndex;
    };

type FlatGroupItems = Array<{
    id: string;
    onClick?: () => void;
    isDisabled?: boolean;
}>;

const flattenVisibleItems = (visibleItems: MenuProps['items']) => {
    const flatGroupItems = visibleItems?.reduce((ids, group, groupIndex) => {
        const groupIds = group.options.map(({ onClick, isDisabled }, index) => ({
            id: `${groupIndex}.${index}`,
            onClick,
            isDisabled,
        }));

        return [...ids, ...groupIds];
    }, [] as FlatGroupItems);

    return flatGroupItems;
};

const getDefaultFocusItemIndex = (items: MenuProps['items']) => {
    if (items?.length) {
        return 0;
    }

    return null;
};

export interface MenuProps {
    items?: GroupedMenuItems[];
    content?: React.ReactNode;
    setToggled: (toggled: boolean) => void;
}

export const Menu = forwardRef<HTMLUListElement, MenuProps>(
    ({ items, content, setToggled }, ref) => {
        const [focusedItemIndex, setFocusedItemIndex] = useState(getDefaultFocusItemIndex(items));

        const visibleItems = items?.map(group => ({
            ...group,
            options: group.options.filter(item => !item.isHidden),
        }));

        const flatGroupItems = flattenVisibleItems(visibleItems);

        // handle selecting an item
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (!flatGroupItems || !flatGroupItems.length || focusedItemIndex === null) {
                    return;
                }

                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();

                    const focusedItem = flatGroupItems[focusedItemIndex];
                    focusedItem?.onClick?.();
                }
            };

            if (focusedItemIndex !== null && flatGroupItems?.length) {
                document.addEventListener('keydown', handleKeyDown);

                return () => {
                    document.removeEventListener('keydown', handleKeyDown);
                };
            }
        }, [focusedItemIndex, flatGroupItems, setToggled]);

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

        const keyboardFocusedItemId =
            focusedItemIndex !== null ? flatGroupItems?.[focusedItemIndex]?.id : undefined;

        return (
            <Container
                ref={ref}
                tabIndex={content ? 0 : 1} // do not affect tab order when there is no content
                onClick={e => e.stopPropagation()} // prevent closing the menu when clicking on the menu itself or within the menu
            >
                <ElevationUp>
                    <Column gap={spacings.md}>
                        {content}
                        {visibleItems?.map((group, index) => (
                            <Group
                                setToggled={setToggled}
                                index={index}
                                keyboardFocusedItemId={keyboardFocusedItemId}
                                handleItemHover={handleItemHover}
                                {...group}
                                key={group.key}
                            />
                        ))}
                    </Column>
                </ElevationUp>
            </Container>
        );
    },
);
