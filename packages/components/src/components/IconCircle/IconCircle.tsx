import styled from 'styled-components';

import { ExclusiveColorOrVariant, Icon, IconName, IconSize, getIconSize } from '../Icon/Icon';
import { TransientProps } from '../../utils/transientProps';
import {
    IconCircleExclusiveColorOrVariant,
    IconCircleVariant,
    IconCircleColors,
    IconCirclePaddingType,
} from './types';
import {
    mapVariantToIconBackground,
    mapVariantToIconBorderColor,
    mapPaddingTypeToPadding,
    mapPaddingTypeToBorderWidth,
} from './utils';
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
    $paddingType: IconCirclePaddingType;
};

const IconCircleWrapper = styled.div<IconCircleWrapperProps>`
    width: ${({ $size }) => $size}px;
    background: ${mapVariantToIconBackground};
    padding: ${mapPaddingTypeToPadding};
    border-radius: 50%;
    box-shadow: inset 0 0 0 ${mapPaddingTypeToBorderWidth} ${mapVariantToIconBorderColor};
    box-sizing: content-box;

    ${({ $hasBorder }) => !$hasBorder && 'box-shadow: none;'}

    ${withFrameProps}
`;

export type IconCircleProps = {
    name: IconName;
    size: IconSize | number;
    paddingType?: IconCirclePaddingType;
    hasBorder?: boolean;
} & IconCircleExclusiveColorOrVariant &
    AllowedFrameProps;

export const IconCircle = ({
    name,
    size,
    hasBorder = true,
    paddingType = 'large',
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
            $paddingType={paddingType}
            $hasBorder={hasBorder}
            {...wrapperColorOrVariant}
            {...frameProps}
        >
            <Icon name={name} size={size} {...iconColorOrVariant} />
        </IconCircleWrapper>
    );
};

export type { IconCircleVariant, IconCircleColors };
