import styled, { css, useTheme } from 'styled-components';

import { ExtendedMessageDescriptor, TranslationKey } from '@suite-common/intl-types';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    spacingsPx,
    TypographyStyle,
} from '@trezor/theme';
import { getFocusShadowStyle } from '@trezor/components/src/utils/utils';
import { Translation } from 'src/components/suite/Translation';
import { Route } from '@suite-common/suite-types';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { MouseEvent } from 'react';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { Icon, IconName, IconSize, useElevation, Paragraph } from '@trezor/components';

export const NavigationItemBase = styled.div.attrs(() => ({
    tabIndex: 0,
}))`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${spacingsPx.xs};
    border-radius: ${borders.radii.sm};
    color: ${({ theme }) => theme.textSubdued};
    transition:
        color 0.15s,
        background 0.15s;
    cursor: pointer;
    border: 1px solid transparent;
    ${getFocusShadowStyle()}
`;

const Container = styled(NavigationItemBase)<{
    $elevation: Elevation;
    $isActive?: boolean;
    $isRounded?: boolean;
    $typographyStyle?: TypographyStyle;
}>`
    gap: ${({ $typographyStyle }) => ($typographyStyle === 'hint' ? spacingsPx.xs : spacingsPx.md)};
    ${({ theme, $isActive }) =>
        $isActive
            ? css<{ $elevation: Elevation }>`
                  background-color: ${mapElevationToBackground};
                  box-shadow: ${theme.boxShadowBase};
                  color: ${theme.textDefault};

                  path {
                      fill: ${theme.iconDefault};
                  }
              `
            : css`
                  &:hover {
                      color: ${theme.textDefault};

                      path {
                          fill: ${theme.iconDefault};
                      }
                  }
              `}
    ${({ $isRounded }) =>
        $isRounded &&
        css`
            border-radius: ${borders.radii.full};
            padding: ${spacingsPx.xs} ${spacingsPx.md};
        `}
`;

export interface NavigationItemProps {
    nameId: TranslationKey;
    icon: IconName;
    routes?: Route['name'][];
    goToRoute?: Route['name'];
    preserveParams?: boolean;
    isActive?: boolean;
    'data-testid'?: string;
    className?: string;
    values?: ExtendedMessageDescriptor['values'];
    iconSize?: IconSize;
    itemsCount?: number;
    isRounded?: boolean;
    typographyStyle?: TypographyStyle;
}

export const NavigationItem = ({
    nameId,
    icon,
    routes,
    goToRoute,
    isActive,
    'data-testid': dataTest,
    className,
    values,
    preserveParams,
    iconSize = 'large',
    itemsCount,
    isRounded = false,
    typographyStyle = 'body',
}: NavigationItemProps) => {
    const activeRoute = useSelector(selectRouteName);
    const { elevation } = useElevation();
    const dispatch = useDispatch();

    const handleClick = (e: MouseEvent) => {
        e.stopPropagation();

        if (goToRoute !== undefined) {
            dispatch(goto(goToRoute, preserveParams === true ? { preserveParams } : undefined));
        }
    };

    const isActiveRoute = routes?.some(route => route === activeRoute);

    const theme = useTheme();

    return (
        <Container
            $isActive={isActive || isActiveRoute}
            onClick={handleClick}
            data-testid={dataTest || `@suite/menu/${goToRoute}`}
            className={className}
            tabIndex={0}
            $elevation={elevation}
            $isRounded={isRounded}
            $typographyStyle={typographyStyle}
        >
            <Icon name={icon} size={iconSize} color={theme.iconSubdued} pointerEvents="none" />
            <Paragraph typographyStyle={typographyStyle}>
                <Translation id={nameId} values={values} />
            </Paragraph>
            {itemsCount && (
                <Paragraph variant="tertiary" typographyStyle={typographyStyle}>
                    {itemsCount}
                </Paragraph>
            )}
        </Container>
    );
};
