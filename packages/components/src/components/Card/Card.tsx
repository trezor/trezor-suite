import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { borders, Elevation, mapElevationToBackground, spacingsPx } from '@trezor/theme';
import { ElevationContext, useElevation } from '../ElevationContext/ElevationContext';
import { ComponentFrame, FrameProps } from '../../components/common/ComponentFrame';

type PaddingType = 'small' | 'none' | 'normal';

type MapArgs = {
    $paddingType: PaddingType;
};

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

const Container = styled.div`
    border-radius: ${borders.radii.md};
    background: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation0};
    padding: ${spacingsPx.xxxs};
`;
const LabelContainer = styled.div<{ $paddingType: PaddingType }>`
    padding: ${mapPaddingTypeToLabelPadding};
    color: ${({ theme }) => theme.textSubdued};
`;

const CardContainer = styled.div<{ $elevation: Elevation; $paddingType: PaddingType }>`
    display: flex;
    width: 100%;
    flex-direction: column;
    padding: ${mapPaddingTypeToPadding};
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.md};
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
`;

export type CardProps = FrameProps & {
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
    ({ children, forceElevation, paddingType, ...rest }, ref) => {
        const { elevation } = useElevation(forceElevation);

        return (
            <CardContainer ref={ref} $elevation={elevation} $paddingType={paddingType} {...rest}>
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

        return (
            <ComponentFrame margin={margin} maxWidth={maxWidth}>
                {label ? (
                    <Container>
                        <LabelContainer $paddingType={paddingType}>{label}</LabelContainer>
                        <CardComponent {...props} ref={ref} />
                    </Container>
                ) : (
                    <CardComponent {...props} ref={ref} />
                )}
            </ComponentFrame>
        );
    },
);
