import styled from 'styled-components';
import { LayoutGroup, motion } from 'framer-motion';
import { spacingsPx, zIndices } from '@trezor/theme';
import { motionEasing, variables } from '@trezor/components';
import { useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';
import { selectIsLoggedOut } from 'src/reducers/suite/suiteReducer';
import { HoverAnimation } from '../../HoverAnimation';
import { AppNavigationTooltip } from '../../AppNavigation/AppNavigationTooltip';
import { globalPaddingEraserStyle } from './utils';

const Container = styled.div<{ isFullWidth: boolean }>`
    position: sticky;
    top: 64px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: ${spacingsPx.sm};
    height: ${SUBPAGE_NAV_HEIGHT};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    padding: ${spacingsPx.xs} 0 ${spacingsPx.sm};
    border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation0};
    overflow: scroll hidden;
    z-index: ${zIndices.pageHeader};

    ${globalPaddingEraserStyle};
`;

const MenuElement = styled.div<{ isActive: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    color: ${({ isActive, theme }) => !isActive && theme.textOnTertiary};
    white-space: nowrap;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-right: ${spacingsPx.md};
    }
`;

const Underline = styled(motion.div)`
    position: absolute;
    bottom: -${spacingsPx.sm};
    left: 0;
    right: 0;
    height: 2px;
    background: ${({ theme }) => theme.iconDefault};
`;

const StyledNavLink = styled.div<{ isActive: boolean; isNavigationDisabled: boolean }>`
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    opacity: ${({ isActive, isNavigationDisabled }) => !isActive && isNavigationDisabled && '.5'};
    cursor: ${({ isActive, isNavigationDisabled }) =>
        isActive || isNavigationDisabled ? 'default' : 'pointer'};
`;

export type NavigationItem = {
    id: string;
    callback: () => void;
    title: JSX.Element;
    'data-test'?: string;
    isHidden?: boolean;
};

interface SubpageNavigationProps {
    items: NavigationItem[];
    className?: string;
}

export const SubpageNavigation = ({ items, className }: SubpageNavigationProps) => {
    const routeName = useSelector(selectRouteName);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const isLoggedOut = useSelector(selectIsLoggedOut);

    const isAccountLoading = selectedAccount.status === 'loading';

    const visibleItems = items.filter(item => !item.isHidden);

    return (
        <Container isFullWidth={isLoggedOut} className={className}>
            <LayoutGroup id={items[0].id}>
                {visibleItems.map(item => {
                    const { id, title } = item;

                    const isActive = routeName === id;
                    const isHoverable = !isActive && !isAccountLoading;
                    const onClick = isAccountLoading ? undefined : item.callback;

                    return (
                        <MenuElement key={id} isActive={isActive}>
                            <HoverAnimation isHoverable={isHoverable}>
                                <AppNavigationTooltip isActiveTab={isActive}>
                                    <StyledNavLink
                                        isActive={isActive}
                                        isNavigationDisabled={isAccountLoading}
                                        onClick={onClick}
                                        data-test={item['data-test']}
                                    >
                                        {title}
                                    </StyledNavLink>
                                </AppNavigationTooltip>
                            </HoverAnimation>

                            {isActive && (
                                <Underline
                                    // TODO: get rid of the weird jump when switching tabs on the account page before enabling this
                                    // layoutId="underline"
                                    transition={{
                                        layout: {
                                            ease: motionEasing.transition,
                                        },
                                    }}
                                />
                            )}
                        </MenuElement>
                    );
                })}
            </LayoutGroup>
        </Container>
    );
};
