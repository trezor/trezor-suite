import styled, { css } from 'styled-components';

import { useSubTabsContext } from './SubTabsContext';
import { mapSizeToIconSize, mapSizeToTypography } from './utils';
import { Row } from '../Flex/Flex';
import { Icon, type IconComponent } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';

const Item = styled.div<{ $isActive: boolean }>`
    border-radius: calc(infinity * 1px);
    transition:
        color 0.15s,
        background 0.15s;
    cursor: pointer;
    background: ${({ theme }) => theme.elementFillElevated};
    box-shadow: ${({ theme }) => theme.elementShadowElevated};
    color: ${({ theme }) => theme.contentPrimary};

    &:hover,
    &:focus {
        color: ${({ theme }) => theme.contentPrimary};
    }

    ${({ $isActive, theme }) =>
        !$isActive &&
        css`
            background: none;
            box-shadow: none;
            color: ${theme.contentSecondary};
        `}
`;

export type SubTabsItemProps = {
    id: string;
    onClick: () => void;
    icon?: IconComponent;
    count?: number;
    children: React.ReactNode;
    'data-testid'?: string;
};

export const SubTabsItem = ({
    id,
    onClick,
    icon,
    count = 0,
    'data-testid': dataTestId,
    children,
}: SubTabsItemProps) => {
    const { activeItemId, size } = useSubTabsContext();
    const isActive = id === activeItemId;

    return (
        <Item $isActive={isActive} onClick={onClick} data-testid={dataTestId}>
            <Row gap={8} padding={{ vertical: 8, horizontal: 16 }}>
                {icon && <Icon as={icon} size={mapSizeToIconSize(size)} />}
                <Text as="div" typographyStyle={mapSizeToTypography(size)} textWrap="nowrap">
                    {children}
                </Text>
                {count > 0 && (
                    <Text typographyStyle={mapSizeToTypography(size)} isDisabled>
                        {count}
                    </Text>
                )}
            </Row>
        </Item>
    );
};
