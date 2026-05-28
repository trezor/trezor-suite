import { type HTMLAttributes, type ReactNode } from 'react';

import styled, { css, useTheme } from 'styled-components';

import { type Elevation, borders } from '@trezor/theme';

import { type CardVariant, type FillType, type PaddingType } from './types';
import { mapFillTypeToCSS, mapPaddingTypeToPadding, mapVariantToColor } from './utils';
import { type AccessibilityProps, withAccessibilityProps } from '../../utils/accessibilityProps';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
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
    'zIndex',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedCardFrameProps)[number]>;

type TransientAllowedFrameProps = TransientProps<AllowedFrameProps>;

type ContainerProps = {
    $elevation: Elevation;
    $fillType: FillType;
    $isClickable: boolean;
    $variant?: CardVariant;
};

const Container = styled.section<ContainerProps & TransientAllowedFrameProps>`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    border-radius: ${borders.radii.md};
    overflow: hidden;
    cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};
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
                border-left: 2px solid ${mapVariantToColor({ theme, $variant })};
                pointer-events: none;
            }
        `}

    ${mapFillTypeToCSS}
    ${withFrameProps}
`;

export type CardProps = AccessibilityProps &
    AllowedFrameProps & {
        header?: ReactNode;
        footer?: ReactNode;
        paddingType?: PaddingType;
        fillType?: FillType;
        onMouseEnter?: HTMLAttributes<HTMLDivElement>['onMouseEnter'];
        onMouseLeave?: HTMLAttributes<HTMLDivElement>['onMouseLeave'];
        onClick?: HTMLAttributes<HTMLDivElement>['onClick'];
        children?: ReactNode;
        variant?: CardVariant;
        'data-testid'?: string;
    };

export const Card = ({
    paddingType = 'normal',
    fillType = 'default',
    header,
    footer,
    onClick,
    onMouseEnter,
    onMouseLeave,
    tabIndex,
    children,
    variant,
    'data-testid': dataTest,
    ...rest
}: CardProps) => {
    const { elevation } = useElevation();
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(
        rest,
        allowedCardFrameProps,
    ) as TransientAllowedFrameProps;

    const content = (
        <>
            {header && (
                <>
                    <Box
                        padding={mapPaddingTypeToPadding({
                            paddingType,
                        })}
                    >
                        <Text as="div" typographyStyle="body-sm-strong">
                            {header}
                        </Text>
                    </Box>
                    <Divider margin={{}} />
                </>
            )}
            <Box
                padding={mapPaddingTypeToPadding({
                    paddingType,
                })}
                flex="1"
            >
                {children}
            </Box>
            {footer && (
                <>
                    <Divider margin={{}} />
                    <Box padding={mapPaddingTypeToPadding({ paddingType })}>{footer}</Box>
                </>
            )}
        </>
    );

    return (
        <Container
            $elevation={elevation}
            $fillType={fillType}
            $isClickable={Boolean(onClick)}
            $variant={variant}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            data-testid={dataTest}
            {...frameProps}
            {...withAccessibilityProps({ tabIndex })}
        >
            {fillType === 'flat' ? (
                <ElevationContext baseElevation={theme.variant === 'dark' ? 0 : -1}>
                    {content}
                </ElevationContext>
            ) : (
                <ElevationUp>{content}</ElevationUp>
            )}
        </Container>
    );
};
