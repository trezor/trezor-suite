import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { borders, Elevation, mapElevationToBackground, spacingsPx } from '@trezor/theme';
import { ElevationContext, useElevation } from '../ElevationContext/ElevationContext';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../components/common/frameProps';
import { makePropsTransient, TransientProps } from '../../utils/transientProps';
import { AccessabilityProps, withAccessabilityProps } from '../common/accessabilityProps';

type PaddingType = 'small' | 'none' | 'normal';

type MapArgs = {
    $paddingType: PaddingType;
};

export const allowedCardFrameProps: FramePropsKeys[] = ['margin', 'maxWidth'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedCardFrameProps)[number]>;

const mapPaddingTypeToLabelPadding = ({ $paddingType }: MapArgs): number | string => {
    const paddingMap: Record<PaddingType, number | string> = {
        none: `${spacingsPx.xxs} 0`,
        small: `${spacingsPx.xxs} ${spacingsPx.sm}`,
        normal: `${spacingsPx.xs} ${spacingsPx.lg}`,
    };

    return paddingMap[$paddingType];
};
const mapPaddingTypeToPadding = ({ $paddingType }: MapArgs): number | string => {
    const paddingMap: Record<PaddingType, number | string> = {
        none: 0,
        small: spacingsPx.sm,
        normal: spacingsPx.lg,
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
    AccessabilityProps & {
        paddingType?: PaddingType;
        onMouseEnter?: HTMLAttributes<HTMLDivElement>['onMouseEnter'];
        onMouseLeave?: HTMLAttributes<HTMLDivElement>['onMouseLeave'];
        onClick?: HTMLAttributes<HTMLDivElement>['onClick'];
        children?: ReactNode;
        className?: string;
        label?: ReactNode;
        forceElevation?: Elevation;
    };

const CardComponent = forwardRef<HTMLDivElement, CardProps & { paddingType: PaddingType }>(
    ({ children, forceElevation, paddingType, tabIndex, onClick, ...rest }, ref) => {
        const { elevation } = useElevation(forceElevation);

        return (
            <CardContainer
                ref={ref}
                $elevation={elevation}
                $paddingType={paddingType}
                $isClickable={Boolean(onClick)}
                onClick={onClick}
                {...withAccessabilityProps({ tabIndex })}
                {...rest}
            >
                <ElevationContext baseElevation={elevation}>{children}</ElevationContext>
            </CardContainer>
        );
    },
);

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ paddingType = 'normal', label, margin, maxWidth, ...rest }, ref) => {
        const props = {
            paddingType,
            ...rest,
        };

        const frameProps = {
            margin,
            maxWidth,
        };

        return label ? (
            <Container {...makePropsTransient(frameProps)}>
                <LabelContainer $paddingType={paddingType}>{label}</LabelContainer>
                <CardComponent {...props} ref={ref} />
            </Container>
        ) : (
            <CardComponent {...props} {...makePropsTransient(frameProps)} ref={ref} />
        );
    },
);
