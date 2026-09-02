import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type ExchangeIssue } from '@suite-common/trading';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingOfferExchangeIssueBanner } from './TradingOfferExchangeIssueBanner';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id, values }: { id: string; values?: { percent?: string } }) => (
        <span>{values?.percent ? `${id} ${values.percent}` : id}</span>
    ),
}));

const priceImpactIssue: ExchangeIssue = {
    type: 'price-impact',
    severity: 'warning',
    deviation: 0.152,
};

const highRiskIssue: ExchangeIssue = {
    type: 'high-risk',
    severity: 'critical',
    validation: { riskLevel: 'Malicious', features: [] },
};

const highRiskWithPriceImpactIssue: ExchangeIssue = {
    type: 'high-risk-with-price-impact',
    severity: 'critical',
    validation: { riskLevel: 'Malicious', features: [] },
    deviation: 0.99,
};

const slippageTooLowIssue: ExchangeIssue = {
    type: 'slippage-too-low',
    severity: 'warning',
};

const onContinueAnywayClick = jest.fn();

const renderIssueBanner = ({
    issue,
    isSimulationEnabled = true,
}: {
    issue: ExchangeIssue;
    isSimulationEnabled?: boolean;
}) => {
    const services = { analytics: mockDesktopAnalytics() };
    const root = createTestCompositionRoot({
        extra: { services },
        preloadedState: mockInitialAppState satisfies AppState,
    });
    renderWithProviders(
        root,
        <TradingOfferExchangeIssueBanner
            issue={issue}
            isSimulationEnabled={isSimulationEnabled}
            isContinueDisabled={false}
            isContinueLoading={false}
            onContinueAnywayClick={onContinueAnywayClick}
        />,
    );
};

describe('TradingOfferExchangeIssueBanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the price impact issue with the deviation as a rounded percent', () => {
        renderIssueBanner({ issue: priceImpactIssue });

        expect(screen.getByText('TR_TRADING_PRICE_IMPACT_TITLE 15%')).toBeInTheDocument();
        expect(screen.getByText('TR_TRADING_PRICE_IMPACT_DESCRIPTION')).toBeInTheDocument();
    });

    it('renders the high-risk issue with its title and description', () => {
        renderIssueBanner({ issue: highRiskIssue });

        expect(screen.getByText('TR_TRADING_HIGH_RISK_SWAP_TITLE')).toBeInTheDocument();
        expect(screen.getByText('TR_TRADING_HIGH_RISK_SWAP_DESCRIPTION')).toBeInTheDocument();
    });

    it('renders the combined issue as bullets under the high-risk title', () => {
        renderIssueBanner({ issue: highRiskWithPriceImpactIssue });

        expect(screen.getByText('TR_TRADING_HIGH_RISK_SWAP_TITLE')).toBeInTheDocument();
        expect(screen.getByText('TR_TRADING_HIGH_RISK_SWAP_DESCRIPTION')).toBeInTheDocument();
        expect(screen.getByText('TR_TRADING_PRICE_IMPACT_TITLE 99%')).toBeInTheDocument();
    });

    it('renders the slippage-too-low issue with its title and description', () => {
        renderIssueBanner({ issue: slippageTooLowIssue });

        expect(screen.getByText('TR_TRADING_SLIPPAGE_TOO_LOW_TITLE')).toBeInTheDocument();
        expect(screen.getByText('TR_TRADING_SLIPPAGE_TOO_LOW_DESCRIPTION')).toBeInTheDocument();
    });

    it('continues the swap on continue anyway click', async () => {
        renderIssueBanner({ issue: priceImpactIssue });

        await userEvent.click(screen.getByTestId('@trading/offer/continue-anyway'));

        expect(onContinueAnywayClick).toHaveBeenCalledTimes(1);
    });

    it('renders a passive banner without continue anyway when the simulation is off', () => {
        renderIssueBanner({ issue: priceImpactIssue, isSimulationEnabled: false });

        expect(screen.getByText('TR_TRADING_PRICE_IMPACT_TITLE 15%')).toBeInTheDocument();
        expect(screen.queryByTestId('@trading/offer/continue-anyway')).not.toBeInTheDocument();
    });
});
