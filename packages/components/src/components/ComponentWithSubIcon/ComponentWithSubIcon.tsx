import styled, { useTheme } from 'styled-components';
import {
    ExclusiveColorOrVariant,
    getColorForIconVariant,
    getIconSize,
    Icon,
    IconProps,
} from '../Icon/Icon';
import { borders, spacingsPx } from '@trezor/theme';
import { TransientProps } from '../../utils/transientProps';
import { ReactNode } from 'react';
import { FramePropsKeys, FrameProps, withFrameProps } from '../../utils/frameProps';

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
    position: absolute;

    right: -${({ $subIconSize }) => $subIconSize / 2 + 3}px;
    top: -${({ $subIconSize }) => $subIconSize / 2 + 3}px;

    background-color: ${({ theme, $variant, $color }) =>
        getColorForIconVariant({ theme, variant: $variant, color: $color })};
    border-radius: ${borders.radii.full};
    border: 1px solid ${({ theme }) => theme['borderElevationNegative']};
    padding: ${spacingsPx.xxxs};
`;

export type ComponentWithSubIconProps = AllowedFrameProps &
    ExclusiveColorOrVariant & {
        subIconProps?: IconProps;
        children: ReactNode;
    };

export const ComponentWithSubIcon = ({
    variant,
    color,
    children,
    subIconProps,
    margin,
}: ComponentWithSubIconProps) => {
    const theme = useTheme();

    if (subIconProps === undefined) {
        return <Container $margin={margin}>{children}</Container>;
    }

    const backgroundIconColor = getColorForIconVariant({
        theme,
        color,
        variant,
    });

    const iconColor = getColorForIconVariant({
        theme,
        color: subIconProps.color,
        variant: subIconProps.variant,
    });

    const subIconSize = getIconSize(subIconProps.size ?? 12);

    return (
        <Container $margin={margin}>
            {children}
            <SubIconWrapper
                $color={backgroundIconColor}
                $subIconColor={iconColor}
                $subIconSize={subIconSize}
            >
                <Icon {...subIconProps} size={subIconSize} />
            </SubIconWrapper>
        </Container>
    );
};
