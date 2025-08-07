import { ReactNode } from 'react';

import styled, { useTheme } from 'styled-components';

import { borders, spacingsPx } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import {
    ExclusiveColorOrVariant,
    IconProps,
    getColorForIconVariant,
    getIconSize,
} from '../Icon/Icon';

export const allowedComponentWithSubIconFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedComponentWithSubIconFrameProps)[number]>;

const Container = styled.div<TransientProps<AllowedFrameProps>>`
    position: relative;

    ${withFrameProps}
`;

type SubIconWrapperProps = TransientProps<ExclusiveColorOrVariant> & {
    $subIconColor: string;
    $subIconSize: number;
};

const SubIconWrapper = styled.div<SubIconWrapperProps>`
    width: ${spacingsPx.sm};
    height: ${spacingsPx.sm};

    display: flex;
    justify-content: center;
    align-items: center;

    position: absolute;
    right: -${({ $subIconSize }) => $subIconSize / 2 + 3}px;
    top: -${({ $subIconSize }) => $subIconSize / 2 + 3}px;

    background-color: ${({ theme, $variant, $color }) =>
        getColorForIconVariant({ theme, variant: $variant, color: $color })};
    border-radius: ${borders.radii.full};
    border: 1px solid ${({ theme }) => theme['borderElevationNegative']};
`;

export type ComponentWithSubIconProps = AllowedFrameProps &
    ExclusiveColorOrVariant & {
        subIcon?: React.ReactElement<IconProps>;
        children: ReactNode;
    };

export const ComponentWithSubIcon = ({
    variant,
    color,
    children,
    subIcon,
    ...rest
}: ComponentWithSubIconProps) => {
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(rest, allowedComponentWithSubIconFrameProps);

    if (subIcon === undefined) {
        return <Container {...frameProps}>{children}</Container>;
    }

    const backgroundIconColor = getColorForIconVariant({
        theme,
        color,
        variant,
    });

    const iconColor = getColorForIconVariant({
        theme,
        color: subIcon.props.color,
        variant: subIcon.props.variant,
    });

    const subIconSize = getIconSize(subIcon.props.size ?? 12);

    return (
        <Container {...frameProps}>
            {children}
            <SubIconWrapper
                $color={backgroundIconColor}
                $subIconColor={iconColor}
                $subIconSize={subIconSize}
            >
                {subIcon}
            </SubIconWrapper>
        </Container>
    );
};
