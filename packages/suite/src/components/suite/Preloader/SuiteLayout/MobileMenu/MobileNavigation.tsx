import { transparentize } from 'polished';
import styled, { css } from 'styled-components';

import { findRouteByName } from 'src/utils/suite/router';
import { variables } from '@trezor/components';
import { HoverAnimation, Translation } from 'src/components/suite';
import { MAIN_MENU_ITEMS } from 'src/constants/suite/menu';
import { useAccountSearch, useSelector, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';

interface ComponentProps {
    isActive: boolean;
    isDisabled?: boolean;
}

const MobileWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 16px;
    flex: 1;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const StyledHoverAnimation = styled(HoverAnimation)`
    ${variables.SCREEN_QUERY.ABOVE_TABLET} {
        & + & {
            margin-left: 12px;
        }
    }
`;

const MobileMenuItem = styled.div<ComponentProps>`
    display: flex;
    padding: 20px 24px;
    font-size: ${({ isActive }) => (isActive ? '20px' : '16px')};
    font-weight: ${({ isActive }) => isActive && variables.FONT_WEIGHT.DEMI_BOLD};
    cursor: ${({ isDisabled, isActive }) => (!isDisabled && !isActive ? 'pointer' : 'default')};

    & + & {
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }
`;

const ItemTitleWrapper = styled.span`
    position: relative;
`;

const ItemTitle = styled.span<ComponentProps>`
    color: ${({ theme }) => transparentize(0.3, theme.TYPE_DARK_GREY)};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    line-height: 24px;

    ${({ isActive }) =>
        isActive &&
        css`
            color: ${({ theme }) => theme.TYPE_DARK_GREY};
            font-size: ${variables.FONT_SIZE.H3};
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
        background: ${({ theme }) => theme.BG_LIGHT_GREEN};
        color: ${({ theme }) => theme.TYPE_GREEN};
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
        <MobileWrapper>
            {MAIN_MENU_ITEMS.map(item => {
                const { route, translationId, isDisabled } = item;
                const routeObj = findRouteByName(route);
                const isActive = routeObj ? routeObj.app === activeApp : false;
                return (
                    <StyledHoverAnimation isHoverable={!isActive} key={route}>
                        <MobileMenuItem
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
                        </MobileMenuItem>
                    </StyledHoverAnimation>
                );
            })}
        </MobileWrapper>
    );
};
