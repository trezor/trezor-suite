import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';
import { configureStore } from 'src/support/tests/configureStore';

import { TradingLayout } from './TradingLayout';
import { extraDependenciesDesktopMock } from '../../../../../../mocks/extraDependenciesDesktopMock';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/tx-simulation', () => ({}));

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span data-testid={id}>{id}</span>,
}));

jest.mock('./TradingLayoutNavigation', () => ({
    TradingLayoutNavigation: ({ route }: { route?: string }) => (
        <div data-testid="trading-layout-navigation">{route}</div>
    ),
}));

const buildState = (): AppState => ({
    ...mockInitialAppState,
    router: {
        ...mockInitialAppState.router,
        app: 'wallet',
        route: {
            name: 'wallet-trading-buy',
            pattern: '/accounts/coinmarket/buy',
            app: 'wallet',
        },
    } as AppState['router'],
});

const mockStore = configureStore<AppState, any>();

describe('TradingLayout', () => {
    it('always renders children regardless of visible accounts or device state', () => {
        const store = mockStore(buildState());

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <TradingLayout>
                <div data-testid="trading-content" />
            </TradingLayout>,
        );

        expect(screen.getByTestId('trading-layout-navigation')).toHaveTextContent(
            'wallet-trading-buy',
        );
        expect(screen.getByTestId('trading-content')).toBeInTheDocument();
    });
});
