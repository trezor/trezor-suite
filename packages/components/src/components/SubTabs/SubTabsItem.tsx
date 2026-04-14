import styled, { css } from 'styled-components';

import { type Elevation, borders, mapElevationToBackground, spacings } from '@trezor/theme';

import { useSubTabsContext } from './SubTabsContext';
import { mapSizeToIconSize, mapSizeToTypography } from './utils';
import { useElevation } from '../ElevationContext/ElevationContext';
import { Row } from '../Flex/Flex';
import { Icon, type IconName } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';

const Item = styled.div<{ $isActive: boolean; $elevation: Elevation }>`
    border-radius: ${borders.radii.full};
    transition:
        color 0.15s,
        background 0.15s;
    cursor: pointer;
    background: ${mapElevationToBackground};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
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
    iconName?: IconName;
    count?: number;
    children: React.ReactNode;
    'data-testid'?: string;
};

export const SubTabsItem = ({
    id,
    onClick,
    iconName,
    count = 0,
    'data-testid': dataTestId,
    children,
}: SubTabsItemProps) => {
    const { activeItemId, size } = useSubTabsContext();
    const { elevation } = useElevation();
    const isActive = id === activeItemId;

    return (
        <Item
            $isActive={isActive}
            $elevation={elevation}
            onClick={onClick}
            data-testid={dataTestId}
        >
            <Row gap={spacings.xs} padding={{ vertical: spacings.xs, horizontal: spacings.md }}>
                {iconName && <Icon name={iconName} size={mapSizeToIconSize(size)} />}
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
