import React, { forwardRef, useEffect, useState } from 'react';

import styled from 'styled-components';

import { borders, spacings } from '@trezor/theme';

import { menuStyle } from './menuStyle';
import { Box } from '../Box/Box';
import { ElevationUp } from '../ElevationContext/ElevationContext';
import { Column, Row } from '../Flex/Flex';
import { Icon, IconName } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';

const Container = styled.div`
    ${menuStyle};
`;

const MenuList = styled.ul`
    list-style: none;
    display: block;
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

export type MenuProps = {
    items?: DropdownMenuItemProps[];
    content?: React.ReactNode;
    onClose?: () => void;
};

export const Menu = forwardRef<HTMLUListElement, MenuProps>(({ items, content, onClose }, ref) => {
    const visibleItems = items?.filter(item => !item.isHidden);
    const [focusedItemIndex, setFocusedItemIndex] = useState(
        visibleItems?.length ? visibleItems.findIndex(item => !item.isDisabled) : null,
    );

    // handle selecting an item
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!visibleItems || !visibleItems.length || focusedItemIndex === null) {
                return;
            }

            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();

                const focusedItem = visibleItems[focusedItemIndex];

                onClose?.();
                focusedItem?.onClick?.();
            }
        };

        if (focusedItemIndex !== null && visibleItems?.length) {
            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [focusedItemIndex, visibleItems, onClose]);

    // handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
                visibleItems &&
                visibleItems.length > 0 &&
                focusedItemIndex !== null
            ) {
                e.preventDefault();
                let indexCandidate = focusedItemIndex;
                const direction = e.key === 'ArrowUp' ? -1 : 1;
                const getNextIndex = (index: number, dir: number) =>
                    (index + dir + visibleItems.length) % visibleItems.length;

                do {
                    indexCandidate = getNextIndex(indexCandidate, direction);
                } while (
                    visibleItems[indexCandidate].isDisabled &&
                    indexCandidate !== focusedItemIndex
                );

                setFocusedItemIndex(indexCandidate);
            }
        };

        if (focusedItemIndex !== null && visibleItems?.length) {
            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [visibleItems, focusedItemIndex]);

    return (
        <Container
            tabIndex={content ? 0 : 1} // do not affect tab order when there is no content
            onClick={e => e.stopPropagation()} // prevent closing the menu when clicking on the menu itself or within the menu
        >
            <ElevationUp>
                <Column gap={spacings.md}>
                    {content}
                    {visibleItems?.length && (
                        <MenuList ref={ref}>
                            {visibleItems?.map((item, index) => (
                                <MenuItem
                                    isKeyboardSelected={index === focusedItemIndex}
                                    onMouseEnter={() =>
                                        !item.isDisabled && setFocusedItemIndex(index)
                                    }
                                    data-testid={item['data-testid']}
                                    {...item}
                                    onClick={() => {
                                        onClose?.();
                                        item.onClick?.();
                                    }}
                                    key={index}
                                />
                            ))}
                        </MenuList>
                    )}
                </Column>
            </ElevationUp>
        </Container>
    );
});
