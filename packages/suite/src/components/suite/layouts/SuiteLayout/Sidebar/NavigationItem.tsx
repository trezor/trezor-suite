import { type MouseEvent } from 'react';

import styled, { css } from 'styled-components';

import { type ExtendedMessageDescriptor, Translation, type TranslationKey } from '@suite/intl';
import { type Route, goto, selectRouteName } from '@suite/router';
import {
    Icon,
    type IconName,
    type IconSize,
    Paragraph,
    Tooltip,
    useElevation,
} from '@trezor/components';
import { getFocusShadowStyle } from '@trezor/components/src/utils/utils';
import {
    type Elevation,
    type TypographyStyle,
    borders,
    mapElevationToBackground,
    spacingsPx,
} from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

export const NavigationItemBase = styled.div.attrs(() => ({
    tabIndex: 0,
}))`
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${spacingsPx.xs};
    border-radius: ${borders.radii.sm};
    color: ${({ theme }) => theme.contentSecondary};
    transition:
        color 0.15s,
        background 0.15s;
    cursor: pointer;
    border: 1px solid transparent;
    -webkit-app-region: no-drag;
    ${getFocusShadowStyle()}
`;

const Container = styled(NavigationItemBase)<{
    $elevation: Elevation;
    $isActive?: boolean;
    $isRounded?: boolean;
    $typographyStyle?: TypographyStyle;
}>`
    gap: ${({ $typographyStyle }) =>
        $typographyStyle === 'body-sm' ? spacingsPx.xs : spacingsPx.md};
    ${({ theme, $isActive }) =>
        $isActive
            ? css<{ $elevation: Elevation }>`
                  background-color: ${mapElevationToBackground};
                  box-shadow: ${theme.boxShadowBase};
                  color: ${theme.contentPrimary};

                  path {
                      fill: ${theme.contentPrimary};
                  }
              `
            : css`
                  &:hover {
                      color: ${theme.contentPrimary};

                      path {
                          fill: ${theme.contentPrimary};
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
    expanded?: boolean;
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
    onClick?: () => void;
}

type TitleProps = {
    nameId: TranslationKey;
    values?: ExtendedMessageDescriptor['values'];
};

const Title = ({ nameId, values }: TitleProps) => <Translation id={nameId} values={values} />;

export const NavItem = (props: NavigationItemProps) => {
    const {
        nameId,
        icon,
        expanded,
        routes,
        goToRoute,
        isActive,
        'data-testid': dataTest,
        className,
        values,
        preserveParams,
        iconSize = 24,
        itemsCount,
        isRounded = false,
        typographyStyle = 'body-md',
        onClick,
    } = props;

    const activeRoute = useSelector(selectRouteName);
    const { elevation } = useElevation();
    const dispatch = useDispatch();

    const handleClick = (e: MouseEvent) => {
        e.stopPropagation();

        onClick?.();

        if (goToRoute !== undefined) {
            dispatch(
                goto({
                    routeName: goToRoute,
                    ...(preserveParams === true ? { preserveParams } : undefined),
                }),
            );
        }
    };

    const isActiveRoute = routes?.some(route => route === activeRoute);

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
            <Tooltip
                cursor="pointer"
                content={<Title nameId={nameId} values={values} />}
                isActive={!expanded}
                placement="right"
                hasArrow
            >
                <Icon
                    name={icon}
                    size={iconSize}
                    intent="neutral"
                    priority="secondary"
                    pointerEvents="none"
                />
            </Tooltip>
            {expanded && (
                <>
                    <Paragraph typographyStyle={typographyStyle}>
                        <Translation id={nameId} values={values} />
                    </Paragraph>

                    {itemsCount && (
                        <Paragraph
                            intent="neutral"
                            priority="secondary"
                            typographyStyle={typographyStyle}
                        >
                            {itemsCount}
                        </Paragraph>
                    )}
                </>
            )}
        </Container>
    );
};

export const NavigationItem = (props: NavigationItemProps) => {
    const { isSidebarCollapsed } = useResponsiveContext();

    return <NavItem expanded={!isSidebarCollapsed} {...props} />;
};
