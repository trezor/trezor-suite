import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TestStore, fireEvent, screen } from '@suite-native/test-utils-store';

import { ExchangeUsdcPresetButton } from './ExchangeUsdcPresetButton';
import {
    createTradingLightStore,
    createTradingPreloadedState,
    renderWithTradingProvider,
} from '../../__tests__/tradingTestUtils';

const mockSetValue = jest.fn();
const mockGetValues = jest.fn();

jest.mock('../../hooks/exchange/useExchangeFormContext', () => ({
    useExchangeFormContext: () => ({ getValues: mockGetValues, setValue: mockSetValue }),
}));

const ethAccountWithUsdc = mockWalletAccount({
    symbol: 'eth',
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

    afterEach(() => {
        screen.unmount();
    });

    it('without a matching account shows an error message', () => {
        const store = createTradingLightStore({ tradeType: 'exchange' });
        renderWithTradingProvider(<ExchangeUsdcPresetButton />, { store });

        expect(screen.getByText('No account with USDC found.')).toBeOnTheScreen();
    });

    describe('with a matching ETH account that has a USDC token', () => {
        let store: TestStore;

        beforeEach(() => {
            const preloadedState = createTradingPreloadedState({
                tradeType: 'exchange',
                overrides: { wallet: { accounts: [ethAccountWithUsdc] } },
            });
            store = createTradingLightStore({ tradeType: 'exchange', overrides: preloadedState });
            renderWithTradingProvider(<ExchangeUsdcPresetButton />, { store });
        });

        it('renders the preset button', () => {
            expect(screen.getByText('Prefill 1 USDC→USDT')).toBeOnTheScreen();
        });

        it('fills form for 1 USDC -> USDT trade', () => {
            fireEvent.press(screen.getByText(/1 USDC.*USDT/));

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
