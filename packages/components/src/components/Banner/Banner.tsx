import { ReactNode } from 'react';
import styled, { css, useTheme } from 'styled-components';

import { variables } from '../../config';
import { Elevation, borders, spacingsPx, typography, spacings } from '@trezor/theme';
import { Row, Column, TransientProps, useElevation, useMediaQuery } from '../..';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { BannerContext } from './BannerContext';
import { BannerButton } from './BannerButton';
import { BannerVariant } from './types';
import { DEFAULT_VARIANT } from './consts';
import { BannerIconButton } from './BannerIconButton';
import {
    mapVariantToBackgroundColor,
    mapVariantToIcon,
    mapVariantToIconColor,
    mapVariantToTextColor,
} from './utils';
import { Icon, IconName } from '../Icon/Icon';
import { SCREEN_SIZE } from '../../config/variables';

export const allowedBannerFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBannerFrameProps)[number]>;

export type BannerProps = AllowedFrameProps & {
    children: ReactNode;
    className?: string;
    variant?: BannerVariant;
    rightContent?: ReactNode;
    icon?: IconName | true;
    filled?: boolean;
    'data-testid'?: string;
};

type WrapperParams = TransientProps<AllowedFrameProps> & {
    $variant: BannerVariant;
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

export const Banner = ({
    children,
    className,
    variant = DEFAULT_VARIANT,
    icon,
    filled = true,
    rightContent,
    'data-testid': dataTest,
    ...rest
}: BannerProps) => {
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
    const frameProps = pickAndPrepareFrameProps(rest, allowedBannerFrameProps);

    return (
        <Wrapper
            $variant={variant}
            $withIcon={withIcon}
            className={className}
            $elevation={elevation}
            $filled={filled}
            data-testid={dataTest}
            {...frameProps}
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
                    <BannerContext.Provider value={{ variant }}>
                        {rightContent}
                    </BannerContext.Provider>
                )}
            </ContentComponent>
        </Wrapper>
    );
};

Banner.Button = BannerButton;
Banner.IconButton = BannerIconButton;
