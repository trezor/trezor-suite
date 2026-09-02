import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingLayout } from './TradingLayout';
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

describe('TradingLayout', () => {
    it('always renders children regardless of visible accounts or device state', () => {
        const root = createTestCompositionRoot({
            extra: { services: { analytics: mockDesktopAnalytics() } },
            preloadedState: buildState(),
        });

        renderWithProviders(
            root,
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
