import styled, { css } from 'styled-components';
import { LayoutGroup, motion } from 'framer-motion';
import { spacings, spacingsPx, zIndices } from '@trezor/theme';
import { motionEasing, variables } from '@trezor/components';
import { useSelector } from 'src/hooks/suite';
import { SECONDARY_PANEL_HEIGHT } from '../../AppNavigation/AppNavigation';
import { HoverAnimation } from '../../HoverAnimation';
import { AppNavigationTooltip } from '../../AppNavigation/AppNavigationTooltip';
import { MAX_CONTENT_WIDTH, MAX_CONTENT_WIDTH_NUMERIC } from 'src/constants/suite/layout';
import { SIDEBAR_WIDTH_NUMERIC } from './Sidebar/Sidebar';

const sidePaddingWidth = `(100vw - ${MAX_CONTENT_WIDTH} + ${
    spacings.md * 2
}px - ${SIDEBAR_WIDTH_NUMERIC}px) / 2`;

export const globalPaddingEraserStyle = css`
    padding: 0 ${spacingsPx.md};

    /* when paddings begin to appear due to the layout not being hugged by the content
    here, the negative horizontal margins are equal to the paddings */
    margin: 0 calc(-1 * ${sidePaddingWidth}) ${spacingsPx.lg};

    /* when the content is hugged by the layout */
    @media (max-width: ${MAX_CONTENT_WIDTH_NUMERIC + SIDEBAR_WIDTH_NUMERIC}px) {
        margin: 0 -${spacingsPx.md} ${spacingsPx.lg};
    }
`;

const Container = styled.div`
    position: sticky;
    top: 64px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: ${spacingsPx.sm};
    height: ${SECONDARY_PANEL_HEIGHT};
    padding: 0 ${spacingsPx.md};
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

    :first-child {
        margin-left: ${spacingsPx.xs};
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-right: ${spacingsPx.md};
    }
`;

const Underline = styled(motion.div)`
    position: absolute;
    bottom: -${spacingsPx.sm};
    left: 0;
    right: 0;
    height: 4px;
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
    const routeName = useSelector(state => state.router.route?.name);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const isAccountLoading = selectedAccount.status === 'loading';

    const visibleItems = items.filter(item => !item.isHidden);

    return (
        <Container className={className}>
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
                                    // TODO: get rid of the weird jump when switching tabs on the account page
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
