import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { borders, Elevation, mapElevationToBackground, spacingsPx } from '@trezor/theme';
import { ElevationContext, useElevation } from '../ElevationContext/ElevationContext';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { AccessibilityProps, withAccessibilityProps } from '../../utils/accessibilityProps';

export const paddingTypes = ['small', 'none', 'normal', 'large'] as const;
export type PaddingType = (typeof paddingTypes)[number];

type MapArgs = {
    $paddingType: PaddingType;
};

export const allowedCardFrameProps = [
    'margin',
    'width',
    'maxWidth',
    'minWidth',
    'height',
    'minHeight',
    'maxHeight',
    'overflow',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedCardFrameProps)[number]>;

const mapPaddingTypeToLabelPadding = ({ $paddingType }: MapArgs): number | string => {
    const paddingMap: Record<PaddingType, number | string> = {
        none: `${spacingsPx.xxs} 0`,
        small: `${spacingsPx.xxs} ${spacingsPx.sm}`,
        normal: `${spacingsPx.xs} ${spacingsPx.lg}`,
        large: `${spacingsPx.sm} ${spacingsPx.xl}`,
    };

    return paddingMap[$paddingType];
};
const mapPaddingTypeToPadding = ({ $paddingType }: MapArgs): number | string => {
    const paddingMap: Record<PaddingType, number | string> = {
        none: 0,
        small: spacingsPx.sm,
        normal: spacingsPx.lg,
        large: spacingsPx.xl,
    };

    return paddingMap[$paddingType];
};

const Container = styled.div<TransientProps<AllowedFrameProps>>`
    border-radius: ${borders.radii.md};
    background: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation0};
    padding: ${spacingsPx.xxxs};

    ${withFrameProps}
`;

const LabelContainer = styled.div<{ $paddingType: PaddingType }>`
    padding: ${mapPaddingTypeToLabelPadding};
    color: ${({ theme }) => theme.textSubdued};
`;

const CardContainer = styled.div<
    {
        $elevation: Elevation;
        $paddingType: PaddingType;
        $isClickable: boolean;
    } & TransientProps<AllowedFrameProps>
>`
    display: flex;
    width: 100%;
    flex-direction: column;
    padding: ${mapPaddingTypeToPadding};
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.md};

    ${({ $isClickable, theme }) =>
        $isClickable &&
        `
    &:hover {
        box-shadow: ${theme.boxShadowElevated};
        cursor: pointer;
    }
    `}

    box-shadow: ${({ theme, $elevation }) => $elevation === 1 && theme.boxShadowBase};

    ${({ onClick, theme }) =>
        onClick !== undefined
            ? css`
                  &:hover {
                      cursor: pointer;

                      box-shadow: ${() => theme.boxShadowElevated};
                  }
              `
            : ''}

    /* when theme changes from light to dark */
    transition: background 0.3s, box-shadow 0.2s;

    ${withFrameProps}
`;

export type CardProps = AllowedFrameProps &
    AccessibilityProps & {
        paddingType?: PaddingType;
        onMouseEnter?: HTMLAttributes<HTMLDivElement>['onMouseEnter'];
        onMouseLeave?: HTMLAttributes<HTMLDivElement>['onMouseLeave'];
        onClick?: HTMLAttributes<HTMLDivElement>['onClick'];
        children?: ReactNode;
        className?: string;
        label?: ReactNode;
        forceElevation?: Elevation;
    };

const CardComponent = forwardRef<HTMLDivElement, CardProps & { $paddingType: PaddingType }>(
    (
        {
            children,
            forceElevation,
            $paddingType,
            onClick,
            onMouseEnter,
            onMouseLeave,
            className,
            tabIndex,
        },
        ref,
    ) => {
        const { elevation } = useElevation(forceElevation);

        return (
            <CardContainer
                ref={ref}
                $elevation={elevation}
                $paddingType={$paddingType}
                $isClickable={Boolean(onClick)}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                className={className}
                onMouseLeave={onMouseLeave}
                {...withAccessibilityProps({ tabIndex })}
            >
                <ElevationContext baseElevation={elevation}>{children}</ElevationContext>
            </CardContainer>
        );
    },
);

export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            paddingType = 'normal',
            label,
            onClick,
            onMouseEnter,
            onMouseLeave,
            className,
            tabIndex,
            children,
            ...rest
        },
        ref,
    ) => {
        const commonProps = {
            onClick,
            onMouseEnter,
            onMouseLeave,
            className,
            tabIndex,
            $paddingType: paddingType,
            children,
        };
        const frameProps = pickAndPrepareFrameProps(rest, allowedCardFrameProps);

        return label ? (
            <Container {...frameProps}>
                <LabelContainer $paddingType={paddingType}>{label}</LabelContainer>
                <CardComponent {...commonProps} ref={ref} />
            </Container>
        ) : (
            <CardComponent {...commonProps} {...frameProps} ref={ref} />
        );
    },
);
