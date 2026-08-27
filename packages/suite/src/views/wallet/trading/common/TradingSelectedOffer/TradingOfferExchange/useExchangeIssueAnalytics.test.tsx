import '@suite-common/test-utils/globalOverrides';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { type ExchangeIssue } from '@suite-common/trading';

import { type AppState } from 'src/reducers/store';
import { renderHookWithProviders } from 'src/support/test-utils/hooksHelper';

import { getTradingExchangeIssue, useExchangeIssueAnalytics } from './useExchangeIssueAnalytics';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

const HIGH_RISK_ISSUE: ExchangeIssue = {
    type: 'high-risk',
    severity: 'critical',
    validation: { riskLevel: 'Malicious', features: [] },
};

const PRICE_IMPACT_ISSUE: ExchangeIssue = {
    type: 'price-impact',
    severity: 'warning',
    deviation: 0.12,
};

type IssueAnalyticsProps = {
    issue: ExchangeIssue | null;
    isSimulationLoading: boolean;
    isSimulation: boolean;
};

const renderIssueAnalytics = (initialProps: IssueAnalyticsProps) => {
    const report = jest.fn();
    const services: DesktopAnalyticsDep = { analytics: mockDesktopAnalytics(report) };

    const { rerender } = renderHookWithProviders(
        configureMockStore({
            extra: undefined,
            preloadedState: mockInitialAppState satisfies AppState,
        }),
        services,
        (props: IssueAnalyticsProps) => useExchangeIssueAnalytics(props),
        { initialProps },
    );

    return { report, rerender };
};

describe('getTradingExchangeIssue', () => {
    it('flattens a price impact issue with its severity', () => {
        expect(getTradingExchangeIssue(PRICE_IMPACT_ISSUE)).toBe('price-impact-warning');
        expect(getTradingExchangeIssue({ ...PRICE_IMPACT_ISSUE, severity: 'critical' })).toBe(
            'price-impact-critical',
        );
    });

    it('keeps the other issue types as they are', () => {
        expect(getTradingExchangeIssue(HIGH_RISK_ISSUE)).toBe('high-risk');
        expect(
            getTradingExchangeIssue({
                type: 'high-risk-with-price-impact',
                severity: 'critical',
                validation: { riskLevel: 'Malicious', features: [] },
                deviation: 0.99,
            }),
        ).toBe('high-risk-with-price-impact');
        expect(getTradingExchangeIssue({ type: 'slippage-too-low', severity: 'warning' })).toBe(
            'slippage-too-low',
        );
    });
});

describe('useExchangeIssueAnalytics', () => {
    it('reports the issue once, no matter how often the card re-renders', () => {
        const { report, rerender } = renderIssueAnalytics({
            issue: HIGH_RISK_ISSUE,
            isSimulationLoading: false,
            isSimulation: true,
        });

        rerender({ issue: HIGH_RISK_ISSUE, isSimulationLoading: false, isSimulation: true });

        expect(report).toHaveBeenCalledTimes(1);
        expect(report).toHaveBeenCalledWith({
            type: events.tradingExchangeIssueEvent.name,
            payload: {
                issue: 'high-risk',
                isSimulation: true,
            },
        });
    });

    it('waits for the simulation instead of reporting the quote-derived issue first', () => {
        const { report, rerender } = renderIssueAnalytics({
            issue: PRICE_IMPACT_ISSUE,
            isSimulationLoading: true,
            isSimulation: false,
        });

        expect(report).not.toHaveBeenCalled();

        rerender({ issue: HIGH_RISK_ISSUE, isSimulationLoading: false, isSimulation: true });

        expect(report).toHaveBeenCalledTimes(1);
        expect(report).toHaveBeenCalledWith({
            type: events.tradingExchangeIssueEvent.name,
            payload: {
                issue: 'high-risk',
                isSimulation: true,
            },
        });
    });

    it('reports nothing without an issue', () => {
        const { report } = renderIssueAnalytics({
            issue: null,
            isSimulationLoading: false,
            isSimulation: true,
        });

        expect(report).not.toHaveBeenCalled();
    });
});
