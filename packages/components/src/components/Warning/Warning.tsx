import { ReactNode } from 'react';
import styled, { DefaultTheme, css, useTheme } from 'styled-components';

import { Icon, IconType } from '../assets/Icon/Icon';
import { variables } from '../../config';
import {
    CSSColor,
    Color,
    Elevation,
    borders,
    mapElevationToBackgroundToken,
    spacingsPx,
    typography,
    spacings,
} from '@trezor/theme';
import { UIVariant } from '../../config/types';
import { Button, ButtonProps, Row, TransientProps, useElevation } from '../..';
import { FrameProps, FramePropsKeys, withFrameProps } from '../common/frameProps';

export const allowedWarningFrameProps: FramePropsKeys[] = ['margin'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedWarningFrameProps)[number]>;

export type WarningVariant = Extract<
    UIVariant,
    'primary' | 'secondary' | 'info' | 'warning' | 'destructive' | 'tertiary'
>;

export type WarningProps = AllowedFrameProps & {
    children: ReactNode;
    buttons?: Array<ButtonProps>;
    className?: string;
    variant?: WarningVariant;
    withIcon?: boolean;
    icon?: IconType;
    filled?: boolean;
    dataTest?: string;
};

type MapArgs = {
    $variant: WarningVariant;
    theme: DefaultTheme;
    $elevation: Elevation;
};

const mapVariantToBackgroundColor = ({ $variant, theme, $elevation }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation0',
        secondary: 'backgroundNeutralBold',
        info: 'backgroundAlertBlueSubtleOnElevation0',
        warning: 'backgroundAlertYellowSubtleOnElevation0',
        destructive: 'backgroundAlertRedSubtleOnElevation0',
        tertiary: mapElevationToBackgroundToken({ $elevation }),
    };

    return theme[colorMap[$variant]];
};

const mapVariantToTextColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'textPrimaryDefault',
        secondary: 'textDefaultInverted',
        info: 'textAlertBlue',
        warning: 'textAlertYellow',
        destructive: 'textAlertRed',
        tertiary: 'textSubdued',
    };

    return theme[colorMap[$variant]];
};
const mapVariantToIconColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'iconPrimaryDefault',
        secondary: 'iconDefaultInverted',
        info: 'iconAlertBlue',
        warning: 'iconAlertYellow',
        destructive: 'iconAlertRed',
        tertiary: 'iconSubdued',
    };

    return theme[colorMap[$variant]];
};

const mapVariantToIcon = ({ $variant }: Pick<MapArgs, '$variant'>): IconType => {
    const iconMap: Record<WarningVariant, IconType> = {
        primary: 'LIGHTBULB',
        secondary: 'INFO',
        info: 'INFO',
        warning: 'WARNING',
        destructive: 'WARNING',
        tertiary: 'INFO',
    };

    return iconMap[$variant];
};

type WrapperParams = TransientProps<AllowedFrameProps> & {
    $variant: WarningVariant;
    $withIcon?: boolean;
    $elevation: Elevation;
    $filled: boolean;
};

const Wrapper = styled.div<WrapperParams>`
    align-items: center;
    ${({ $filled }) =>
        $filled
            ? css<WrapperParams>`
                  background: ${mapVariantToBackgroundColor};
                  border-radius: ${borders.radii.xs};
              `
            : ''}

    color: ${mapVariantToTextColor};
    display: flex;
    ${typography.hint}
    gap: ${spacingsPx.sm};
    padding: ${spacingsPx.sm} ${spacingsPx.lg};
    width: 100%;

    ${withFrameProps}

    ${variables.SCREEN_QUERY.MOBILE} {
        align-items: stretch;
        flex-direction: column;
        gap: ${spacingsPx.xs};
    }
`;

export const Warning = ({
    children,
    className,
    variant = 'warning',
    withIcon,
    icon,
    filled = true,
    margin,
    buttons,
    dataTest,
}: WarningProps) => {
    const theme = useTheme();
    const { elevation } = useElevation();

    return (
        <Wrapper
            $variant={variant}
            $withIcon={withIcon}
            className={className}
            $elevation={elevation}
            $filled={filled}
            $margin={margin}
            data-test={dataTest}
        >
            {withIcon && (
                <Icon
                    size={20}
                    icon={icon === undefined ? mapVariantToIcon({ $variant: variant }) : icon}
                    color={mapVariantToIconColor({
                        $variant: variant,
                        theme,
                        $elevation: elevation,
                    })}
                />
            )}
            <Row justifyContent="space-between" gap={spacings.lg} flex={1}>
                <div>{children}</div>
                {buttons && (
                    <Row gap={spacings.lg} flex={1}>
                        {buttons.length > 0 &&
                            buttons.map(buttonProps => (
                                <Button variant={variant} {...buttonProps} />
                            ))}
                    </Row>
                )}
            </Row>
        </Wrapper>
    );
};
