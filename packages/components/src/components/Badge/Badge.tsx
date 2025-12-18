import React from 'react';

import styled, { useTheme } from 'styled-components';

import { borders } from '@trezor/theme';

import { BadgeIntent, BadgeSize } from './types';
import {
    mapIntentToBackgroundColor,
    mapIntentToIconColor,
    mapIntentToTextColor,
    mapSizeToIconSize,
    mapSizeToPadding,
    mapSizeToTypographyStyle,
} from './utils';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { Row } from '../Flex/Flex';
import { Icon, IconName } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';

export const allowedBadgeFrameProps = ['margin', 'cursor'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBadgeFrameProps)[number]>;

export type BadgeProps = AllowedFrameProps & {
    size?: BadgeSize;
    intent?: BadgeIntent;
    iconLeft?: IconName;
    iconRight?: IconName;
    children?: React.ReactNode;
    'data-testid'?: string;
};

type BadgeContainerProps = {
    $size: BadgeSize;
    $intent: BadgeIntent;
} & TransientProps<AllowedFrameProps>;

// TODO: Replace with Box component
const Container = styled.div<BadgeContainerProps>`
    display: inline-flex;
    border-radius: ${borders.radii.full};
    background: ${({ $intent, theme }) => mapIntentToBackgroundColor($intent, theme)};

    ${withFrameProps}
`;

export const Badge = ({
    size = 'medium',
    intent = 'neutral',
    iconLeft,
    iconRight,
    children,
    'data-testid': dataTest,
    ...rest
}: BadgeProps) => {
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(rest, allowedBadgeFrameProps);

    const iconProps = {
        color: mapIntentToIconColor(intent, theme),
        size: mapSizeToIconSize(size),
    };

    return (
        <Container $size={size} $intent={intent} data-testid={dataTest} {...frameProps}>
            <Row gap={4} padding={mapSizeToPadding(size)}>
                {iconLeft && <Icon name={iconLeft} {...iconProps} />}
                <Text
                    as="div"
                    typographyStyle={mapSizeToTypographyStyle(size)}
                    color={mapIntentToTextColor(intent, theme)}
                    textWrap="nowrap"
                >
                    {children}
                </Text>
                {iconRight && <Icon name={iconRight} {...iconProps} />}
            </Row>
        </Container>
    );
};

export type { BadgeSize, BadgeIntent };
