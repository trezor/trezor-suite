import styled, { css } from 'styled-components';
import { IconName } from '@suite-common/icons';
import { Icon } from '@suite-common/icons/src/webComponents';
import { TranslationKey } from '@suite-common/intl-types';
import { borders, spacingsPx } from '@trezor/theme';
import { getFocusShadowStyle } from '@trezor/components/src/utils/utils';
import { Translation } from 'src/components/suite/Translation';
import { Route } from '@suite-common/suite-types';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { MouseEvent } from 'react';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

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

const Container = styled(NavigationItemBase)<Pick<NavigationItemProps, 'isActive'>>`
    ${({ theme, isActive }) =>
        isActive
            ? css`
                  background: ${theme.backgroundSurfaceElevation1};
                  box-shadow: ${theme.boxShadowBase};
                  color: ${theme.textDefault};

                  path {
                      stroke: ${theme.iconDefault};
                  }
              `
            : css`
                  :hover {
                      color: ${theme.textDefault};

                      path {
                          stroke: ${theme.iconDefault};
                      }
                  }
              `}
`;

export interface NavigationItemProps {
    nameId: TranslationKey;
    icon: IconName;
    route?: Route['name'];
    isActive?: boolean;
    dataTest?: string;
    className?: string;
}

export const NavigationItem = ({
    nameId,
    icon,
    route,
    isActive,
    dataTest,
    className,
}: NavigationItemProps) => {
    const activeRoute = useSelector(selectRouteName);

    const dispatch = useDispatch();

    const handleClick = (e: MouseEvent) => {
        e.stopPropagation();

        if (route) {
            dispatch(goto(route));
        }
    };

    const isActiveRoute = activeRoute === route;

    return (
        <Container
            isActive={isActive || isActiveRoute}
            onClick={handleClick}
            data-test={`@suite/menu/${dataTest || route}`}
            className={className}
            tabIndex={0}
        >
            <Icon name={icon} size="large" color="iconSubdued" />
            <Translation id={nameId} />
        </Container>
    );
};
