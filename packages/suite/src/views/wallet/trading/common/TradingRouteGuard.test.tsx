import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type Localization } from '@suite-common/suite-types';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingRouteGuard } from './TradingRouteGuard';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

type TranslationMockProps = { id: string };

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: TranslationMockProps) => <span>{id}</span>,
}));

const RESTRICTED_CONTENT: Localization = {
    en: 'Restricted by message',
    es: '',
    cs: '',
    de: '',
    fr: '',
    pt: '',
};

type RenderGuardParams = {
    routeName: string;
    isFinpromRestricted: boolean;
    content?: Localization;
};

const renderGuard = ({ routeName, isFinpromRestricted, content }: RenderGuardParams) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            messageSystem: mockMessageSystemStateWithFeatureFlags(
                { [Feature.finprom.presenceRestriction]: isFinpromRestricted },
                { [Feature.finprom.presenceRestriction]: { countries: ['US'] } },
                content,
            ),
        },
    });

    renderWithProviders(
        services,
        <TradingRouteGuard routeName={routeName}>
            <span>page</span>
        </TradingRouteGuard>,
    );
};

describe('TradingRouteGuard', () => {
    it('shows the message content instead of a trading page when restricted', () => {
        renderGuard({
            routeName: 'wallet-trading-buy',
            isFinpromRestricted: true,
            content: RESTRICTED_CONTENT,
        });

        expect(screen.getByText('Restricted by message')).toBeInTheDocument();
        expect(screen.queryByText('page')).not.toBeInTheDocument();
    });

    it('falls back to the built-in text when the message has no content', () => {
        renderGuard({ routeName: 'wallet-trading-redirect', isFinpromRestricted: true });

        expect(screen.getByText('TR_TRADING_RESTRICTED')).toBeInTheDocument();
        expect(screen.queryByText('page')).not.toBeInTheDocument();
    });

    it('shows a non-trading page when restricted', () => {
        renderGuard({ routeName: 'suite-earn', isFinpromRestricted: true });

        expect(screen.getByText('page')).toBeInTheDocument();
    });

    it('shows a trading page when not restricted', () => {
        renderGuard({ routeName: 'wallet-trading-buy', isFinpromRestricted: false });

        expect(screen.getByText('page')).toBeInTheDocument();
    });
});
