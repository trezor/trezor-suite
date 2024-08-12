import styled, { css } from 'styled-components';
import { IconName, IconSize } from '@suite-common/icons';
import { Icon } from '@suite-common/icons/src/webComponents';
import { ExtendedMessageDescriptor, TranslationKey } from '@suite-common/intl-types';
import { Elevation, borders, mapElevationToBackground, spacingsPx } from '@trezor/theme';
import { getFocusShadowStyle } from '@trezor/components/src/utils/utils';
import { Translation } from 'src/components/suite/Translation';
import { Route } from '@suite-common/suite-types';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { MouseEvent } from 'react';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { useElevation } from '@trezor/components';

const StyledIcon = styled(Icon)`
    pointer-events: none;
`;

export const NavigationItemBase = styled.div.attrs(() => ({
    tabIndex: 0,
}))`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.md};
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
}>`
    ${({ theme, $isActive }) =>
        $isActive
            ? css<{ $elevation: Elevation }>`
                  background-color: ${mapElevationToBackground};
                  box-shadow: ${theme.boxShadowBase};
                  color: ${theme.textDefault};

                  path {
                      stroke: ${theme.iconDefault};
                  }
              `
            : css`
                  &:hover {
                      color: ${theme.textDefault};

                      path {
                          stroke: ${theme.iconDefault};
                      }
                  }
              `}
`;

const Count = styled.div`
    color: ${({ theme }) => theme.textSubdued};
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

    return (
        <Container
            $isActive={isActive || isActiveRoute}
            onClick={handleClick}
            data-testid={dataTest || `@suite/menu/${goToRoute}`}
            className={className}
            tabIndex={0}
            $elevation={elevation}
        >
            <StyledIcon name={icon} size={iconSize} color="iconSubdued" />
            <Translation id={nameId} values={values} />
            {itemsCount && <Count>{itemsCount}</Count>}
        </Container>
    );
};
