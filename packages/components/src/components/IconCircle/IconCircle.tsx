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
import { Icon, IconName, IconProps, IconSize } from '../Icon/Icon';

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
    flex-shrink: 0;
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
    const frameProps = pickAndPrepareFrameProps(rest, allowedIconCircleFrameProps);
    let iconProps: Pick<IconProps, 'intent' | 'priority' | 'isDisabled'>;
    if (variant === 'primary') {
        iconProps = { intent: 'brand' };
    } else if (variant === 'info') {
        iconProps = { intent: 'info' };
    } else if (variant === 'tertiary') {
        iconProps = { intent: 'neutral', priority: 'secondary' };
    } else if (variant === 'warning') {
        iconProps = { intent: 'warning' };
    } else if (variant === 'destructive') {
        iconProps = { intent: 'critical' };
    } else {
        iconProps = { intent: 'neutral' };
    }

    return (
        <IconCircleWrapper
            $size={size}
            $paddingType={paddingType}
            $hasBorder={hasBorder}
            $variant={variant}
            {...frameProps}
        >
            <Icon name={name} {...iconProps} />
        </IconCircleWrapper>
    );
};

export type { IconCircleVariant };
