import styled, { css } from 'styled-components';

import { IconCirclePaddingType, IconCircleVariant } from './types';
import {
    mapPaddingTypeToDimensions,
    mapVariantToIconBackground,
    mapVariantToIconBorderColor,
} from './utils';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { IconProps, IconSize, getIconSize } from '../Icon/Icon';
import React from 'react';

export const allowedIconCircleFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedIconCircleFrameProps)[number]>;

type IconCircleWrapperProps = TransientProps<AllowedFrameProps> & {
    $size: number;
    $hasBorder: boolean;
    $paddingType: IconCirclePaddingType;
    $variant: IconCircleVariant;
};

const IconCircleWrapper = styled.div<IconCircleWrapperProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${mapVariantToIconBackground};
    border-radius: 50%;
    box-shadow: inset 0 0 0 ${({ $size }) => $size * 0.1}px ${mapVariantToIconBorderColor};

    ${({ $hasBorder }) => !$hasBorder && 'box-shadow: none;'}
    ${({ $size }) => css`
        width: ${$size}px;
        height: ${$size}px;
    `}

    ${withFrameProps}

    > * {
        width: ${mapPaddingTypeToDimensions};
        height: ${mapPaddingTypeToDimensions};
    }
`;

export type IconCircleProps = {
    icon: React.ReactElement<IconProps>;
    size?: IconSize | number;
    paddingType?: IconCirclePaddingType;
    hasBorder?: boolean;
    variant?: IconCircleVariant;
} & AllowedFrameProps;

export const IconCircle = ({
    icon,
    size = 60,
    hasBorder = true,
    paddingType = 'large',
    variant = 'primary',
    ...rest
}: IconCircleProps) => {
    const iconSize = getIconSize(size);
    const frameProps = pickAndPrepareFrameProps(rest, allowedIconCircleFrameProps);

    return (
        <IconCircleWrapper
            $size={iconSize}
            $paddingType={paddingType}
            $hasBorder={hasBorder}
            $variant={variant}
            {...frameProps}
        >
            {React.cloneElement(icon, {
                size: iconSize,
                variant,
            })}
        </IconCircleWrapper>
    );
};

export type { IconCircleVariant };
