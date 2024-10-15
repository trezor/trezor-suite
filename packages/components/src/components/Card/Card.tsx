import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';
import { borders, Elevation, spacingsPx } from '@trezor/theme';
import { ElevationUp, useElevation } from '../ElevationContext/ElevationContext';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { AccessibilityProps, withAccessibilityProps } from '../../utils/accessibilityProps';
import { PaddingType, FillType } from './types';
import { mapPaddingTypeToLabelPadding, mapPaddingTypeToPadding, mapFillTypeToCSS } from './utils';

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

const Container = styled.div<TransientProps<AllowedFrameProps>>`
    width: 100%;
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
        $fillType: FillType;
        $isClickable: boolean;
    } & TransientProps<AllowedFrameProps>
>`
    width: 100%;
    padding: ${mapPaddingTypeToPadding};
    border-radius: ${borders.radii.md};
    transition:
        background 0.3s,
        box-shadow 0.2s,
        border-color 0.2s;
    cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};

    ${mapFillTypeToCSS}
    ${withFrameProps}
`;

type CommonCardProps = AccessibilityProps & {
    paddingType?: PaddingType;
    fillType?: FillType;
    onMouseEnter?: HTMLAttributes<HTMLDivElement>['onMouseEnter'];
    onMouseLeave?: HTMLAttributes<HTMLDivElement>['onMouseLeave'];
    onClick?: HTMLAttributes<HTMLDivElement>['onClick'];
    children?: ReactNode;
    className?: string;
    label?: ReactNode;
    'data-testid'?: string;
};

export type CardPropsWithTransientProps = CommonCardProps & TransientProps<AllowedFrameProps>;
export type CardProps = CommonCardProps & AllowedFrameProps;

const CardComponent = forwardRef<HTMLDivElement, CardPropsWithTransientProps>(
    (
        {
            children,
            paddingType = 'normal',
            fillType = 'default',
            onClick,
            onMouseEnter,
            onMouseLeave,
            className,
            tabIndex,
            'data-testid': dataTest,
            ...rest
        },
        ref,
    ) => {
        const { elevation } = useElevation();

        return (
            <CardContainer
                ref={ref}
                $elevation={elevation}
                $paddingType={paddingType}
                $fillType={fillType}
                $isClickable={Boolean(onClick)}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                className={className}
                onMouseLeave={onMouseLeave}
                {...withAccessibilityProps({ tabIndex })}
                {...rest}
                data-testid={dataTest}
            >
                {fillType === 'none' ? children : <ElevationUp>{children}</ElevationUp>}
            </CardContainer>
        );
    },
);

export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            paddingType = 'normal',
            fillType = 'default',
            label,
            onClick,
            onMouseEnter,
            onMouseLeave,
            className,
            tabIndex,
            children,
            'data-testid': dataTest,
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
            paddingType,
            fillType,
            children,
            'data-testid': dataTest,
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
