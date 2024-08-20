import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';

import { Icon, IconType } from '../Icon/Icon';
import { variables } from '../../config';
import { Elevation, borders, spacingsPx, typography, spacings } from '@trezor/theme';
import { Row, Column, TransientProps, useElevation } from '../..';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
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
    icon?: IconType | true;
    isSubtle?: boolean;
    'data-testid'?: string;
};

type WrapperParams = TransientProps<AllowedFrameProps> & {
    $variant: WarningVariant;
    $withIcon?: boolean;
    $elevation: Elevation;
    $isSubtle: boolean;
};

const Wrapper = styled.div<WrapperParams>`
    align-items: center;
    background: ${mapVariantToBackgroundColor};
    border-radius: ${borders.radii.xs};
    color: ${mapVariantToTextColor};
    display: flex;
    ${typography.hint}
    gap: ${spacingsPx.sm};
    padding: ${spacingsPx.sm} ${spacingsPx.lg};

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
    icon,
    isSubtle = false,
    margin,
    rightContent,
    'data-testid': dataTest,
}: WarningProps) => {
    const theme = useTheme();
    const { elevation } = useElevation();

    const withIcon = icon !== undefined;

    return (
        <Wrapper
            $variant={variant}
            $withIcon={withIcon}
            className={className}
            $elevation={elevation}
            $isSubtle={isSubtle}
            $margin={margin}
            data-testid={dataTest}
        >
            {withIcon && (
                <Icon
                    size={20}
                    icon={icon === true ? mapVariantToIcon({ $variant: variant }) : icon}
                    color={mapVariantToIconColor({
                        $variant: variant,
                        theme,
                        $elevation: elevation,
                        $isSubtle: isSubtle,
                    })}
                />
            )}

            <Row justifyContent="space-between" gap={spacings.lg} flex={1}>
                <Column alignItems="flex-start">{children}</Column>
                {rightContent && (
                    <WarningContext.Provider value={{ variant, isSubtle }}>
                        {rightContent}
                    </WarningContext.Provider>
                )}
            </Row>
        </Wrapper>
    );
};

Warning.Button = WarningButton;
Warning.IconButton = WarningIconButton;
