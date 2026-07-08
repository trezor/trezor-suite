import React, { type ReactNode } from 'react';

import { type SpacingValuesNew, borders } from '@trezor/theme';

import { type ComponentWithSubIconIntent } from './types';
import { mapIntentToBackgroundColor, mapIntentToIconColor } from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
} from '../../utils/frameProps';
import { Box } from '../Box/Box';
import { Row } from '../Flex/Flex';
import { Icon, type IconComponent } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';

const SUB_CONTENT_SIZE = 14;

export const allowedComponentWithSubIconFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedComponentWithSubIconFrameProps)[number]>;

export type ComponentWithSubIconProps = AllowedFrameProps & {
    icon?: IconComponent;
    iconSize?: number;
    children: ReactNode;
    subContent?: ReactNode;
    iconPadding?: SpacingValuesNew;
    iconOffset?: SpacingValuesNew;
    intent?: ComponentWithSubIconIntent;
};

export const ComponentWithSubIcon = ({
    intent = 'brand',
    iconSize = 8,
    icon,
    children,
    subContent,
    iconPadding = 2,
    iconOffset = 4,
    ...rest
}: ComponentWithSubIconProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedComponentWithSubIconFrameProps, false);
    const hasSubIcon = icon !== undefined || subContent !== undefined;

    return (
        <Box width="fit-content" position={{ type: 'relative' }} {...frameProps}>
            {children}
            {hasSubIcon && (
                <Box
                    position={{ type: 'absolute', top: iconOffset * -1, right: iconOffset * -1 }}
                    backgroundColor={mapIntentToBackgroundColor(intent)}
                    borderRadius={borders.radii.full}
                    padding={icon !== undefined ? iconPadding : undefined}
                >
                    {icon !== undefined ? (
                        <Icon as={icon} size={iconSize} color={mapIntentToIconColor(intent)} />
                    ) : (
                        <Row
                            justifyContent="center"
                            height={SUB_CONTENT_SIZE}
                            minWidth={SUB_CONTENT_SIZE}
                            padding={{ horizontal: 4 }}
                        >
                            <Text
                                typographyStyle="body-xs"
                                color={mapIntentToIconColor(intent)}
                                textWrap="nowrap"
                            >
                                {subContent}
                            </Text>
                        </Row>
                    )}
                </Box>
            )}
        </Box>
    );
};
