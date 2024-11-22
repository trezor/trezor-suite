import styled, { css } from 'styled-components';

import { borders } from '@trezor/theme';

import { mapSizeToItemPadding, mapSizeToTypography, TRANSFORM_OPTIONS } from './utils';
import { TabsSize } from './types';
import { Text } from '../typography/Text/Text';
import { useTabsContext } from './TabsContext';

const Item = styled.div<{ $isActive: boolean; $isDisabled: boolean; $size: TabsSize }>`
    position: relative;
    padding: ${mapSizeToItemPadding};
    color: ${({ $isActive, theme }) => !$isActive && theme.textOnTertiary};
    white-space: nowrap;
    transition: opacity ${TRANSFORM_OPTIONS};
    cursor: pointer;

    &::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        transform: scale(0.5);
        opacity: 0;
        border-radius: ${borders.radii.sm};
        transition:
            transform ${TRANSFORM_OPTIONS},
            opacity ${TRANSFORM_OPTIONS};
        pointer-events: none;
        z-index: 0;
        background: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation0};
    }

    &:hover::before,
    &:focus::before,
    &:active::before {
        transform: scale(1);
        opacity: 1;
    }

    ${({ $isDisabled }) =>
        $isDisabled &&
        css`
            cursor: default;
            opacity: 0.5;
            pointer-events: none;
        `}
`;

const Title = styled.div`
    position: relative;
    z-index: 1;
`;

export type TabsItemProps = {
    id: string;
    onClick: () => void;
    children: React.ReactNode;
    'data-testid'?: string;
};

export const TabsItem = ({ id, onClick, 'data-testid': dataTestId, children }: TabsItemProps) => {
    const { activeItemId, isDisabled, size, setTabRef } = useTabsContext();

    return (
        <Item
            $isActive={id === activeItemId}
            $isDisabled={id !== activeItemId && isDisabled}
            $size={size}
            ref={setTabRef?.(id)}
            onClick={onClick}
            data-testid={dataTestId}
        >
            <Title>
                <Text as="div" typographyStyle={mapSizeToTypography({ $size: size })}>
                    {children}
                </Text>
            </Title>
        </Item>
    );
};
