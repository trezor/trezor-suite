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
import { Icon, type IconComponent } from '../Icon/Icon';

export const allowedComponentWithSubIconFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedComponentWithSubIconFrameProps)[number]>;

export type ComponentWithSubIconProps = AllowedFrameProps & {
    icon?: IconComponent;
    iconSize?: number;
    children: ReactNode;
    iconPadding?: SpacingValuesNew;
    iconOffset?: SpacingValuesNew;
    intent?: ComponentWithSubIconIntent;
};

export const ComponentWithSubIcon = ({
    intent = 'brand',
    iconSize = 8,
    icon,
    children,
    iconPadding = 2,
    iconOffset = 4,
    ...rest
}: ComponentWithSubIconProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedComponentWithSubIconFrameProps, false);

    return (
        <Box width="fit-content" position={{ type: 'relative' }} {...frameProps}>
            {children}
            {icon && (
                <Box
                    position={{ type: 'absolute', top: iconOffset * -1, right: iconOffset * -1 }}
                    backgroundColor={mapIntentToBackgroundColor(intent)}
                    borderRadius={borders.radii.full}
                    padding={iconPadding}
                >
                    <Icon as={icon} size={iconSize} color={mapIntentToIconColor(intent)} />
                </Box>
            )}
        </Box>
    );
};
