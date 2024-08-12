import { ReactNode } from 'react';
import styled, { css, useTheme } from 'styled-components';

import { Icon, IconType } from '../assets/Icon/Icon';
import { variables } from '../../config';
import { Elevation, borders, spacingsPx, typography, spacings } from '@trezor/theme';
import { Row, TransientProps, useElevation } from '../..';
import { FrameProps, FramePropsKeys, withFrameProps } from '../common/frameProps';
import { WarningContext } from './WarningContext';
import { WarningButton } from './WarningButton';
import { WarningVariant } from './types';
import { DEFAULT_VARIANT } from './consts';
import { WarningIconButton } from './WarningIconButton';
import {
    mapVariantToBackgroundColor,
    mapVariantToIcon,
    mapVariantToIconColor,
    mapVariantToTextColor,
} from './utils';

export const allowedWarningFrameProps: FramePropsKeys[] = ['margin'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedWarningFrameProps)[number]>;

export type WarningProps = AllowedFrameProps & {
    children: ReactNode;
    className?: string;
    variant?: WarningVariant;
    rightContent?: ReactNode;
    withIcon?: boolean;
    icon?: IconType;
    filled?: boolean;
    'data-testid'?: string;
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
    variant = DEFAULT_VARIANT,
    withIcon,
    icon,
    filled = true,
    margin,
    rightContent,
    'data-testid': dataTest,
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
            data-testid={dataTest}
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
                {children}
                {rightContent && (
                    <WarningContext.Provider value={{ variant }}>
                        {rightContent}
                    </WarningContext.Provider>
                )}
            </Row>
        </Wrapper>
    );
};

Warning.Button = WarningButton;
Warning.IconButton = WarningIconButton;
