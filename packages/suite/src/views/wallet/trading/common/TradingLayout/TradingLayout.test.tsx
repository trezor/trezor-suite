import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { type AppState } from 'src/reducers/store';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { configureStore } from 'src/support/tests/configureStore';
import { extraDependenciesDesktopMock } from 'src/support/tests/extraDependenciesDesktop.mock';
import { renderWithProviders } from 'src/support/tests/hooksHelper';

import { TradingLayout } from './TradingLayout';

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
    ...initialAppState,
    router: {
        ...initialAppState.router,
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
