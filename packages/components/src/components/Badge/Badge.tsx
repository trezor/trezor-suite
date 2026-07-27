import React from 'react';

import { type BadgeIntent, type BadgeSize } from './types';
import {
    mapIntentToBackgroundColor,
    mapIntentToIconColor,
    mapSizeToIconSize,
    mapSizeToPadding,
    mapSizeToTypographyStyle,
} from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
} from '../../utils/frameProps';
import { Box } from '../Box/Box';
import { Row } from '../Flex/Flex';
import { Icon, type IconComponent } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';

export const allowedBadgeFrameProps = ['margin', 'cursor'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBadgeFrameProps)[number]>;

export type BadgeProps = AllowedFrameProps & {
    size?: BadgeSize;
    intent?: BadgeIntent;
    iconLeft?: IconComponent;
    iconRight?: IconComponent;
    children?: React.ReactNode;
    'data-testid'?: string;
};

export const Badge = ({
    size = 'medium',
    intent = 'neutral',
    iconLeft,
    iconRight,
    children,
    'data-testid': dataTest,
    ...rest
}: BadgeProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedBadgeFrameProps, false);
    const textPriority = intent === 'neutral' ? 'secondary' : 'primary';

    const iconProps = {
        color: mapIntentToIconColor(intent),
        size: mapSizeToIconSize(size),
    };

    return (
        <Box
            display="inline-flex"
            data-testid={dataTest}
            borderRadius="full"
            backgroundColor={mapIntentToBackgroundColor(intent)}
            {...frameProps}
        >
            <Row gap={4} padding={mapSizeToPadding(size)}>
                {iconLeft && <Icon as={iconLeft} {...iconProps} />}
                <Text
                    as="div"
                    typographyStyle={mapSizeToTypographyStyle(size)}
                    intent={intent}
                    priority={textPriority}
                    textWrap="nowrap"
                >
                    {children}
                </Text>
                {iconRight && <Icon as={iconRight} {...iconProps} />}
            </Row>
        </Box>
    );
};

export type { BadgeSize, BadgeIntent };
