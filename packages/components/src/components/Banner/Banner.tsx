import { ReactNode } from 'react';

import styled, { css, useTheme } from 'styled-components';

import { Elevation, borders, spacingsPx, typography, spacings } from '@trezor/theme';

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
import { Icon, IconName, IconSize } from '../Icon/Icon';
import { SCREEN_SIZE } from '../../config/variables';
import { TransientProps } from '../../utils/transientProps';
import { useMediaQuery } from '../../utils/useMediaQuery';
import { useElevation } from '../ElevationContext/ElevationContext';
import { Column, FlexAlignItems, Row } from '../Flex/Flex';
import { Spinner } from '../loaders/Spinner/Spinner';
import { variables } from '../../config';
import { uiVerticalAlignments } from '../../config/types';

export const allowedBannerFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBannerFrameProps)[number]>;

export const iconVerticalAlignments = uiVerticalAlignments;
export type IconVerticalAlignment = (typeof iconVerticalAlignments)[number];

export type BannerProps = AllowedFrameProps & {
    children: ReactNode;
    className?: string;
    variant?: BannerVariant;
    rightContent?: ReactNode;
    iconAlignment?: IconVerticalAlignment;
    icon?: IconName | true;
    iconSize?: IconSize | number;
    filled?: boolean;
    'data-testid'?: string;
    isLoading?: boolean;
};

type WrapperParams = TransientProps<AllowedFrameProps> & {
    $iconAlignment?: IconVerticalAlignment;
    $variant: BannerVariant;
    $withIcon?: boolean;
    $elevation: Elevation;
    $filled: boolean;
};

export const mapVerticalAlignmentToAlignItems = (
    verticalAlignment: IconVerticalAlignment,
): FlexAlignItems => {
    const alignItemsMap: Record<IconVerticalAlignment, FlexAlignItems> = {
        top: 'flex-start',
        center: 'center',
        bottom: 'flex-end',
    };

    return alignItemsMap[verticalAlignment];
};

const Wrapper = styled.div<WrapperParams>`
    align-items: ${({ $iconAlignment }) =>
        $iconAlignment ? mapVerticalAlignmentToAlignItems($iconAlignment) : 'center'};
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

    ${variables.SCREEN_QUERY.MOBILE} {
        align-items: ${({ $iconAlignment }) =>
            $iconAlignment ? mapVerticalAlignmentToAlignItems($iconAlignment) : 'flex-start'};
    }

    ${withFrameProps}
`;

export const Banner = ({
    children,
    className,
    variant = DEFAULT_VARIANT,
    iconAlignment,
    icon,
    iconSize = 20,
    filled = true,
    rightContent,
    'data-testid': dataTest,
    isLoading = false,
    ...rest
}: BannerProps) => {
    const theme = useTheme();
    const { elevation } = useElevation();

    const withIcon = icon !== undefined;

    const isMobile = useMediaQuery(`(max-width: ${SCREEN_SIZE.SM})`);

    // eslint-disable-next-line @typescript-eslint/no-shadow
    const ContentComponent = ({ children }: { children: ReactNode }) => {
        const commonProps = {
            justifyContent: 'space-between' as const,
            flex: '1' as const,
        };

        return isMobile ? (
            <Column gap={spacings.sm} {...commonProps}>
                {children}
            </Column>
        ) : (
            <Row alignItems="center" gap={spacings.lg} {...commonProps}>
                {children}
            </Row>
        );
    };
    const frameProps = pickAndPrepareFrameProps(rest, allowedBannerFrameProps);

    return (
        <Wrapper
            $iconAlignment={iconAlignment}
            $variant={variant}
            $withIcon={withIcon}
            className={className}
            $elevation={elevation}
            $filled={filled}
            data-testid={dataTest}
            {...frameProps}
        >
            {isLoading && <Spinner size={22} />}
            {!isLoading && withIcon && (
                <Icon
                    size={iconSize}
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
