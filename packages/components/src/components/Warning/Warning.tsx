import { ReactNode } from 'react';
import styled, { css, useTheme } from 'styled-components';

import { variables } from '../../config';
import { Elevation, borders, spacingsPx, typography, spacings } from '@trezor/theme';
import { Row, Column, TransientProps, useElevation, useMediaQuery } from '../..';
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
import { Icon, IconName } from '../Icon/Icon';
import { SCREEN_SIZE } from '../../config/variables';

export const allowedWarningFrameProps: FramePropsKeys[] = ['margin'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedWarningFrameProps)[number]>;

export type WarningProps = AllowedFrameProps & {
    children: ReactNode;
    className?: string;
    variant?: WarningVariant;
    rightContent?: ReactNode;
    icon?: IconName | true;
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
    filled = true,
    margin,
    rightContent,
    'data-testid': dataTest,
}: WarningProps) => {
    const theme = useTheme();
    const { elevation } = useElevation();

    const withIcon = icon !== undefined;

    const isMobile = useMediaQuery(`(max-width: ${SCREEN_SIZE.SM})`);

    const ContentComponent = ({ children }: { children: ReactNode }) => {
        const commonProps = {
            justifyContent: 'space-between' as const,
            gap: spacings.lg,
            flex: '1' as const,
        };

        return isMobile ? (
            <Column {...commonProps} alignItems="stretch">
                {children}
            </Column>
        ) : (
            <Row {...commonProps}>{children}</Row>
        );
    };

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
                    name={icon === true ? mapVariantToIcon({ $variant: variant }) : icon}
                    // Todo: unify variants
                    color={mapVariantToIconColor({
                        $variant: variant,
                        theme,
                        $elevation: elevation,
                    })}
                />
            )}

            <ContentComponent>
                <Column alignItems="flex-start">{children}</Column>
                {rightContent && (
                    <WarningContext.Provider value={{ variant }}>
                        {rightContent}
                    </WarningContext.Provider>
                )}
            </ContentComponent>
        </Wrapper>
    );
};

Warning.Button = WarningButton;
Warning.IconButton = WarningIconButton;
