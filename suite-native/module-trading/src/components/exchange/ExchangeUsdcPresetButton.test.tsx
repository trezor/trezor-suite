import { type Store } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { fireEvent, screen } from '@suite-native/test-utils-store';
import { type TradingRootState } from '@suite-native/trading-state';

import { ExchangeUsdcPresetButton } from './ExchangeUsdcPresetButton';
import {
    createTradingPreloadedState,
    createTradingTestStore,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

type State = TradingRootState & AccountsRootState;

const mockSetValue = jest.fn();
const mockGetValues = jest.fn();

jest.mock('../../hooks/exchange/useExchangeFormContext', () => ({
    useExchangeFormContext: () => ({ getValues: mockGetValues, setValue: mockSetValue }),
}));

const ethAccountWithUsdc = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    accountType: 'normal',
    descriptor: asAccountDescriptor('ethusdc'),
    tokens: [
        {
            standard: 'ERC20',
            name: 'USD Coin',
            contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: 6,
            balance: '1',
        },
    ],
    visible: true,
});

describe('ExchangeUsdcPresetButton', () => {
    beforeEach(() => {
        mockGetValues.mockReset();
        mockSetValue.mockClear();
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('without a matching account shows an error message', async () => {
        const store = createTradingTestStore({ tradeType: 'exchange' });
        await renderWithTradingProvider(<ExchangeUsdcPresetButton />, { services: { store } });

        expect(screen.getByText('No account with USDC found.')).toBeOnTheScreen();
    });

    describe('with a matching ETH account that has a USDC token', () => {
        let store: Store<State>;

        beforeEach(async () => {
            const preloadedState: State = createTradingPreloadedState({
                tradeType: 'exchange',
                overrides: { wallet: { accounts: [ethAccountWithUsdc] } },
            });
            store = createTradingTestStore({ tradeType: 'exchange', overrides: preloadedState });
            await renderWithTradingProvider(<ExchangeUsdcPresetButton />, { services: { store } });
        });

        it('renders the preset button', () => {
            expect(screen.getByText('Prefill 1 USDC→USDT')).toBeOnTheScreen();
        });

        it('fills form for 1 USDC -> USDT trade', async () => {
            await fireEvent.press(screen.getByText(/1 USDC.*USDT/));

            expect(mockSetValue).toHaveBeenCalledWith(
                'sendAsset',
                expect.objectContaining({ symbol: 'USDC', networkId: 'ethereum' }),
            );
            expect(mockSetValue).toHaveBeenCalledWith('sendAccount', ethAccountWithUsdc);
            expect(mockSetValue).toHaveBeenCalledWith('sendCryptoAmount', '1');
            expect(mockSetValue).toHaveBeenCalledWith(
                'receiveAsset',
                expect.objectContaining({ symbol: 'USDT', networkId: 'ethereum' }),
            );

            const tradingState = store.getState().wallet.trading.exchange;
            expect(tradingState.tradingAccountKey).toBe(ethAccountWithUsdc.key);
        });
    });
});
