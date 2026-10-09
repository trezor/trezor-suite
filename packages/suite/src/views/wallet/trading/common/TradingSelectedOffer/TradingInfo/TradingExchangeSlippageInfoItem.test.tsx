import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type WithServices } from '@suite-common/redux-utils';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingExchangeSlippageInfoItem } from './TradingExchangeSlippageInfoItem';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

const renderSlippageInfoItem = (slippage: string, isEditable = false) => {
    const { services } = createTestCompositionRoot<WithServices<DesktopAnalyticsDep>, AppState>({
        preloadedState: mockInitialAppState satisfies AppState,
        services: () => ({ analytics: mockDesktopAnalytics() }),
    });
    renderWithProviders(
        services,
        <TradingExchangeSlippageInfoItem slippage={slippage} isEditable={isEditable} />,
    );
};

describe('TradingExchangeSlippageInfoItem', () => {
    it.each([
        ['1', '1%'],
        ['0.5', '0.5%'],
        ['0.25', '0.25%'],
        ['0.125', '0.13%'],
        ['1.23456', '1.23%'],
    ])('renders slippage %s as %s', (slippage, expected) => {
        renderSlippageInfoItem(slippage);

        expect(screen.getByTestId('@trading/offer/info/slippage')).toHaveTextContent(expected);
    });

    it('renders the editable slippage with at most 2 decimals', () => {
        renderSlippageInfoItem('0.125', true);

        expect(screen.getByTestId('@trading/offer/info/slippage')).toHaveTextContent('0.13%');
    });
});
