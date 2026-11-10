import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { TradingDetailFiatRow } from './TradingDetailFiatRow';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

const renderFiatRow = (isDiscreetModeActive: boolean) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            discreetMode: { isActive: isDiscreetModeActive },
        },
    });

    renderWithProviders(
        services,
        <TradingDetailFiatRow label="TR_TRADING_YOU_PAY" currency="eur" amount="1234.5" />,
    );
};

describe('TradingDetailFiatRow', () => {
    it('shows the fiat amount', () => {
        renderFiatRow(false);

        expect(screen.getByTestId('@trading/form/info/fiat-amount')).toHaveTextContent('1,234.5');
    });

    // Recurring bug: https://github.com/trezor/trezor-suite/issues/23861
    it('hides the fiat amount behind the discreet mode placeholder', () => {
        renderFiatRow(true);

        const fiatAmount = screen.getByTestId('@trading/form/info/fiat-amount');

        expect(fiatAmount).toHaveTextContent('###');
        expect(fiatAmount).not.toHaveTextContent('1,234');
    });
});
