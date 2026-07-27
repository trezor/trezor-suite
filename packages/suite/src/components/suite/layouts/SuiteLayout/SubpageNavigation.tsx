import styled from 'styled-components';

import { type Route, selectRouteName } from '@suite/router';
import { Tabs } from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { HEADER_HEIGHT } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';

import { AppNavigationTooltip } from '../../AppNavigation/AppNavigationTooltip';

const Container = styled.div`
    position: sticky;
    top: ${HEADER_HEIGHT};
    background: ${({ theme }) => theme.surfaceFillPage};
    border-bottom: 1px solid ${({ theme }) => theme.borderNeutral};
    z-index: ${zIndices.stickyBar};
    width: 100%;
`;

const ScrollContainer = styled.div`
    padding: 16px 16px 0;
    overflow: auto hidden;
    width: 100%;
    height: 100%;
`;

type TabRoute = Route['name'] | undefined;

export type NavigationItem<TId extends string = Route['name']> = {
    id: TId;
    callback: () => void;
    title: React.ReactNode;
    'data-testid'?: string;
    isHidden?: boolean;
    activeRoutes?: TabRoute[];
};

type SubpageNavigationProps<TId extends string> = {
    items: NavigationItem<TId>[];
    ['data-testid']: string;
    /**
     * Controlled active tab. When omitted, the active tab is derived from the current route.
     */
    activeItemId?: TId;
};

export const SubpageNavigation = <TId extends string = Route['name']>({
    'data-testid': dataTest,
    items,
    activeItemId,
}: SubpageNavigationProps<TId>) => {
    const routeName = useSelector(selectRouteName);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const isAccountLoading = selectedAccount.status === 'loading';
    const resolvedActiveItemId =
        activeItemId ??
        items.find(({ id, activeRoutes }) => activeRoutes?.includes(routeName) || id === routeName)
            ?.id;

    return (
        <Container data-testid={dataTest}>
            <ScrollContainer>
                <AppNavigationTooltip>
                    <Tabs
                        hasBorder={false}
                        size="large"
                        isDisabled={isAccountLoading}
                        activeItemId={resolvedActiveItemId}
                    >
                        {items
                            .filter(item => !item.isHidden)
                            .map(({ id, callback, title, 'data-testid': dataTestId }) => (
                                <Tabs.Item
                                    key={id}
                                    id={id}
                                    onClick={callback}
                                    data-testid={dataTestId}
                                >
                                    {title}
                                </Tabs.Item>
                            ))}
                    </Tabs>
                </AppNavigationTooltip>
            </ScrollContainer>
        </Container>
    );
};
