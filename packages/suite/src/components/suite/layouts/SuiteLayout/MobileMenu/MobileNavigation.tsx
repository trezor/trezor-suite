import { transparentize } from 'polished';
import styled, { css } from 'styled-components';

import { findRouteByName } from 'src/utils/suite/router';
import { variables } from '@trezor/components';
import { HoverAnimation, Translation } from 'src/components/suite';
import { MAIN_MENU_ITEMS } from 'src/constants/suite/menu';
import { useAccountSearch, useSelector, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { typography } from '@trezor/theme';

interface ComponentProps {
    isActive: boolean;
    isDisabled?: boolean;
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    padding: 16px;
    flex: 1;
    border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation1};
`;

const MenuItem = styled.div<ComponentProps>`
    display: flex;
    padding: 20px 24px;
    ${({ isActive }) => isActive && typography.titleSmall}
    cursor: ${({ isDisabled, isActive }) => (!isDisabled && !isActive ? 'pointer' : 'default')};

    & + & {
        border-top: 1px solid ${({ theme }) => theme.borderOnElevation1};
    }
`;

const ItemTitleWrapper = styled.span`
    position: relative;
`;

const ItemTitle = styled.span<ComponentProps>`
    color: ${({ theme }) => transparentize(0.3, theme.TYPE_DARK_GREY)};
    line-height: 24px;

    ${({ isActive }) =>
        isActive &&
        css`
            color: ${({ theme }) => theme.textSecondaryHighlight};
            ${typography.titleSmall};
        `}

    ${({ isDisabled }) =>
        isDisabled &&
        css`
            cursor: default;
        `}
`;

const NewBadge = styled.span`
    span {
        position: absolute;
        top: -14px;
        right: -30px;
        padding: 3px 3px 2px;
        background: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation1};
        color: ${({ theme }) => theme.textPrimaryDefault};
        letter-spacing: 0.2px;
        text-transform: uppercase;
        font-size: 12px;
        display: flex;
        cursor: default;
        align-items: center;
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
        border-radius: 4px;
    }
`;

interface MobileNavigationProps {
    closeMobileNavigation?: () => void;
}

export const MobileNavigation = ({ closeMobileNavigation }: MobileNavigationProps) => {
    const activeApp = useSelector(state => state.router.app);
    const dispatch = useDispatch();

    const { setCoinFilter, setSearchString } = useAccountSearch();

    return (
        <Container>
            {MAIN_MENU_ITEMS.map(item => {
                const { route, translationId, isDisabled } = item;
                const routeObj = findRouteByName(route);
                const isActive = routeObj ? routeObj.app === activeApp : false;

                return (
                    <HoverAnimation isHoverable={!isActive} key={route}>
                        <MenuItem
                            data-test={`@suite/menu/${route}`}
                            onClick={() => {
                                if (!isDisabled) {
                                    if (route === 'wallet-index') {
                                        setCoinFilter(undefined);
                                        setSearchString(undefined);
                                    }
                                    dispatch(goto(route));
                                    closeMobileNavigation?.();
                                }
                            }}
                            isActive={isActive}
                            isDisabled={isDisabled}
                        >
                            <ItemTitleWrapper>
                                <ItemTitle isActive={isActive} isDisabled={isDisabled}>
                                    <Translation id={translationId} />
                                </ItemTitle>

                                {isDisabled && (
                                    <NewBadge>
                                        <Translation id="TR_NAV_SOON_BADGE" />
                                    </NewBadge>
                                )}
                            </ItemTitleWrapper>
                        </MenuItem>
                    </HoverAnimation>
                );
            })}
        </Container>
    );
};
