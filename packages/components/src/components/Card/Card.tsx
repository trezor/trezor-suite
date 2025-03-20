import { HTMLAttributes, ReactNode } from 'react';

import styled, { css, useTheme } from 'styled-components';

import { Elevation, borders, spacingsPx } from '@trezor/theme';

import { CardVariant, FillType, PaddingType } from './types';
import {
    mapFillTypeToCSS,
    mapPaddingTypeToLabelPadding,
    mapPaddingTypeToPadding,
    mapVariantToColor,
} from './utils';
import { AccessibilityProps, withAccessibilityProps } from '../../utils/accessibilityProps';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { Box } from '../Box/Box';
import { Divider } from '../Divider/Divider';
import { ElevationContext, ElevationUp, useElevation } from '../ElevationContext/ElevationContext';
import { Text } from '../typography/Text/Text';

export const allowedCardFrameProps = [
    'margin',
    'width',
    'maxWidth',
    'minWidth',
    'height',
    'minHeight',
    'maxHeight',
    'overflow',
    'flex',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedCardFrameProps)[number]>;

type ContainerProps = {
    $fillType: FillType;
    $hasLabel: boolean;
};

type TransientAllowedFrameProps = TransientProps<AllowedFrameProps>;

const Container = styled.section<ContainerProps & TransientAllowedFrameProps>`
    width: 100%;
    border-radius: ${borders.radii.md};

    ${({ $hasLabel, $fillType }) =>
        $hasLabel &&
        css`
            background: ${({ theme }) =>
                $fillType !== 'flat' && theme.backgroundTertiaryDefaultOnElevation0};
            padding: ${spacingsPx.xxxs};
        `}

    ${withFrameProps}
`;

type CardContainerProps = {
    $elevation: Elevation;
    $fillType: FillType;
    $isClickable: boolean;
    $variant?: CardVariant;
    $overflow: TransientAllowedFrameProps['$overflow'];
};

const CardContainer = styled.div<CardContainerProps>`
    position: relative;
    border-radius: ${borders.radii.md};
    cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};
    overflow: ${({ $overflow }) => ($overflow ? $overflow : 'hidden')};
    height: 100%;
    transition:
        background 0.5s,
        border 0.5s,
        box-shadow 0.5s;

    ${({ theme, $variant }) =>
        $variant &&
        css`
            &::before {
                content: '';
                position: absolute;
                border-radius: ${borders.radii.md};
                inset: 0;
                border-left: ${spacingsPx.xxs} solid ${mapVariantToColor({ theme, $variant })};
                pointer-events: none;
            }
        `}

    ${mapFillTypeToCSS}
`;

export type CardProps = AccessibilityProps &
    AllowedFrameProps & {
        heading?: ReactNode;
        label?: ReactNode;
        paddingType?: PaddingType;
        fillType?: FillType;
        onMouseEnter?: HTMLAttributes<HTMLDivElement>['onMouseEnter'];
        onMouseLeave?: HTMLAttributes<HTMLDivElement>['onMouseLeave'];
        onClick?: HTMLAttributes<HTMLDivElement>['onClick'];
        children?: ReactNode;
        className?: string;
        variant?: CardVariant;
        'data-testid'?: string;
    };

export const Card = ({
    paddingType = 'normal',
    fillType = 'default',
    heading,
    label,
    onClick,
    onMouseEnter,
    onMouseLeave,
    className,
    tabIndex,
    children,
    variant,
    'data-testid': dataTest,
    ...rest
}: CardProps) => {
    const { elevation } = useElevation();
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(rest, allowedCardFrameProps);

    const content = (
        <>
            {heading && (
                <>
                    <Box
                        padding={mapPaddingTypeToPadding({
                            paddingType,
                            hasHeading: true,
                        })}
                    >
                        <Text as="div" typographyStyle="callout">
                            {heading}
                        </Text>
                    </Box>
                    <Divider margin={{}} />
                </>
            )}
            <Box
                padding={mapPaddingTypeToPadding({
                    paddingType,
                    hasHeading: !!heading,
                })}
                height="100%"
            >
                {children}
            </Box>
        </>
    );

    return (
        <Container $fillType={fillType} $hasLabel={!!label} {...frameProps}>
            {label && (
                <Box padding={mapPaddingTypeToLabelPadding({ paddingType })}>
                    <Text as="div" variant="tertiary">
                        {label}
                    </Text>
                </Box>
            )}
            <CardContainer
                $elevation={elevation}
                $fillType={fillType}
                $isClickable={Boolean(onClick)}
                $variant={variant}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                className={className}
                onMouseLeave={onMouseLeave}
                data-testid={dataTest}
                $overflow={frameProps.$overflow}
                {...withAccessibilityProps({ tabIndex })}
            >
                {fillType === 'flat' ? (
                    <ElevationContext baseElevation={theme.variant === 'dark' ? 0 : -1}>
                        {content}
                    </ElevationContext>
                ) : (
                    <ElevationUp>{content}</ElevationUp>
                )}
            </CardContainer>
        </Container>
    );
};
