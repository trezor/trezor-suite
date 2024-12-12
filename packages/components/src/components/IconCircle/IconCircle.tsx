import styled, { css } from 'styled-components';

import { Icon, IconName, IconSize, getIconSize } from '../Icon/Icon';
import { TransientProps } from '../../utils/transientProps';
import { IconCircleVariant, IconCirclePaddingType } from './types';
import {
    mapVariantToIconBackground,
    mapVariantToIconBorderColor,
    mapPaddingTypeToDimensions,
} from './utils';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';

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
    name: IconName;
    size?: IconSize | number;
    paddingType?: IconCirclePaddingType;
    hasBorder?: boolean;
    variant?: IconCircleVariant;
} & AllowedFrameProps;

export const IconCircle = ({
    name,
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
            <Icon name={name} variant={variant} />
        </IconCircleWrapper>
    );
};

export type { IconCircleVariant };
