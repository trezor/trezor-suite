import styled from 'styled-components';

import { spacingsPx, zIndices } from '@trezor/theme';
import { Tabs } from '@trezor/components';
import { Route } from '@suite-common/suite-types';

import { useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { HEADER_HEIGHT } from 'src/constants/suite/layout';

import { AppNavigationTooltip } from '../../AppNavigation/AppNavigationTooltip';

const Container = styled.div`
    position: sticky;
    top: ${HEADER_HEIGHT};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
    z-index: ${zIndices.pageHeader};
    width: 100%;
    padding: ${spacingsPx.md} ${spacingsPx.md} 0;
`;

type TabRoute = Route['name'] | undefined;

export type NavigationItem = {
    id: Route['name'];
    callback: () => void;
    title: JSX.Element;
    'data-testid'?: string;
    isHidden?: boolean;
    activeRoutes?: TabRoute[];
};

type SubpageNavigationProps = {
    items: NavigationItem[];
};

export const SubpageNavigation = ({ items }: SubpageNavigationProps) => {
    const routeName = useSelector(selectRouteName);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const isAccountLoading = selectedAccount.status === 'loading';
    const activeItemdId = items.find(
        ({ id, activeRoutes }) => activeRoutes?.includes(routeName) || id === routeName,
    )?.id;

    return (
        <Container>
            <AppNavigationTooltip>
                <Tabs
                    hasBorder={false}
                    size="large"
                    isDisabled={isAccountLoading}
                    activeItemId={activeItemdId}
                >
                    {items
                        .filter(item => !item.isHidden)
                        .map(({ id, callback, title, 'data-testid': dataTestId }) => (
                            <Tabs.Item key={id} id={id} onClick={callback} data-testid={dataTestId}>
                                {title}
                            </Tabs.Item>
                        ))}
                </Tabs>
            </AppNavigationTooltip>
        </Container>
    );
};
