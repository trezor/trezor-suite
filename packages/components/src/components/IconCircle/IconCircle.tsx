import styled from 'styled-components';

import { type IconCircleIntent, type IconCircleSize } from './types';
import {
    mapIntentToBackgroundColor,
    mapIntentToBorderColor,
    mapSizeToBorderWidth,
    mapSizeToIconSize,
} from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
import { Icon, type IconComponent } from '../Icon/Icon';

export const allowedIconCircleFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedIconCircleFrameProps)[number]>;

type CircleProps = TransientProps<AllowedFrameProps> & {
    $size: IconCircleSize;
    $intent: IconCircleIntent;
};

const Circle = styled.div<CircleProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border: ${({ $size, $intent, theme }) =>
        `${mapSizeToBorderWidth($size)}px solid ${theme[mapIntentToBorderColor($intent)]}`};
    border-radius: 50%;
    background: ${({ $intent, $size, theme }) => theme[mapIntentToBackgroundColor($intent, $size)]};

    ${withFrameProps}
`;

export type IconCircleProps = {
    icon: IconComponent;
    size?: IconCircleSize;
    intent?: IconCircleIntent;
} & AllowedFrameProps;

export const IconCircle = ({ icon, size = 40, intent = 'brand', ...rest }: IconCircleProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedIconCircleFrameProps);

    return (
        <Circle $size={size} $intent={intent} {...frameProps}>
            <Icon as={icon} size={mapSizeToIconSize(size)} intent={intent} priority="secondary" />
        </Circle>
    );
};

export type { IconCircleIntent, IconCircleSize };
