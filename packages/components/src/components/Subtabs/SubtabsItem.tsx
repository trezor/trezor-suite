import styled, { css } from 'styled-components';

import { borders, spacings, mapElevationToBackground, Elevation } from '@trezor/theme';

import { Row } from '../Flex/Flex';
import { Text } from '../typography/Text/Text';
import { Icon, IconName } from '../Icon/Icon';
import { useSubtabsContext } from './SubtabsContext';
import { mapSizeToTypography, mapSizeToIconSize } from './utils';
import { useElevation } from '../ElevationContext/ElevationContext';

const Item = styled.div<{ $isActive: boolean; $elevation: Elevation }>`
    border-radius: ${borders.radii.full};
    transition:
        color 0.15s,
        background 0.15s;
    cursor: pointer;
    background: ${mapElevationToBackground};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    color: ${({ theme }) => theme.textDefault};

    &:hover,
    &:focus {
        color: ${({ theme }) => theme.textDefault};
    }

    ${({ $isActive, theme }) =>
        !$isActive &&
        css`
            background: none;
            box-shadow: none;
            color: ${theme.textSubdued};
        `}
`;

export type SubtabsItemProps = {
    id: string;
    onClick: () => void;
    iconName?: IconName;
    count?: number;
    children: React.ReactNode;
    'data-testid'?: string;
};

export const SubtabsItem = ({
    id,
    onClick,
    iconName,
    count = 0,
    'data-testid': dataTestId,
    children,
}: SubtabsItemProps) => {
    const { activeItemId, size } = useSubtabsContext();
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
                <Text as="div" typographyStyle={mapSizeToTypography(size)}>
                    {children}
                </Text>
                {count > 0 && (
                    <Text typographyStyle={mapSizeToTypography(size)} variant="disabled">
                        {count}
                    </Text>
                )}
            </Row>
        </Item>
    );
};
