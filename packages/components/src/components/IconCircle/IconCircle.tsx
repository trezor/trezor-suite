import styled from 'styled-components';

import { ExclusiveColorOrVariant, Icon, IconName, IconSize, getIconSize } from '../Icon/Icon';
import { TransientProps } from '../../utils/transientProps';
import { IconCircleExclusiveColorOrVariant, IconCircleVariant, IconCircleColors } from './types';
import { mapVariantToIconBackground, mapVariantToIconBorderColor } from './utils';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';

export const allowedIconCircleFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedIconCircleFrameProps)[number]>;

type IconCircleWrapperProps = TransientProps<
    IconCircleExclusiveColorOrVariant & AllowedFrameProps
> & {
    $size: number;
    $hasBorder: boolean;
};

const IconCircleWrapper = styled.div<IconCircleWrapperProps>`
    width: ${({ $size }) => $size}px;
    background: ${mapVariantToIconBackground};
    padding: ${({ $size }) => $size * 0.75}px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 ${({ $hasBorder, $size }) => ($hasBorder ? $size / 4 : 0)}px
        ${mapVariantToIconBorderColor};
    box-sizing: content-box;

    ${withFrameProps}
`;

export type IconCircleProps = {
    name: IconName;
    size: IconSize | number;
    hasBorder?: boolean;
} & IconCircleExclusiveColorOrVariant &
    AllowedFrameProps;

export const IconCircle = ({
    name,
    size,
    hasBorder = true,
    iconColor,
    variant,
    ...rest
}: IconCircleProps) => {
    const wrapperColorOrVariant: TransientProps<IconCircleExclusiveColorOrVariant> =
        iconColor === undefined ? { $variant: variant ?? 'primary' } : { $iconColor: iconColor };

    const iconColorOrVariant: ExclusiveColorOrVariant =
        iconColor === undefined
            ? { variant: variant ?? 'primary' }
            : { color: iconColor.foreground };

    const iconSize = getIconSize(size);
    const frameProps = pickAndPrepareFrameProps(rest, allowedIconCircleFrameProps);

    return (
        <IconCircleWrapper
            $size={iconSize}
            $hasBorder={hasBorder}
            {...wrapperColorOrVariant}
            {...frameProps}
        >
            <Icon name={name} size={size} {...iconColorOrVariant} />
        </IconCircleWrapper>
    );
};

export type { IconCircleVariant, IconCircleColors };
