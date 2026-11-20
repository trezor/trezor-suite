import { type Store } from '@reduxjs/toolkit';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { tradingExchangeActions } from '@suite-common/trading';
import { screen } from '@suite-native/test-utils-store';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';
import { FEE_SELECTOR_ROW_TEST_ID } from '@suite-native/transaction-management';

import { ExchangeFlowApprovalFeeSelectorRow } from './ExchangeFlowApprovalFeeSelectorRow';
import {
    createTradingTestStore,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn() }),
}));

describe('ExchangeFlowApprovalFeeSelectorRow', () => {
    let store: Store<TradingRootState>;

    beforeEach(() => {
        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(mercuryoFixedWorstQuote));
        store.dispatch(tradingExchangeActions.setTradingAccountKey(eth1NormalAccount.key));
    });

    it('renders the fee selector row for the account', async () => {
        await renderWithTradingProvider(
            <ExchangeFlowApprovalFeeSelectorRow accountKey={eth1NormalAccount.key} />,
            { services: { store, networks: mockNetworksServices() }, tradeType: 'exchange' },
        );

        expect(screen.getByTestId(FEE_SELECTOR_ROW_TEST_ID)).toBeOnTheScreen();
    });
});
