import { RootStackRoutes } from '@suite-native/navigation';
import { act } from '@suite-native/test-utils-store';
import {
    btc1NormalAccount,
    createPrecomposedTxFinal,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';
import { mergeDeepObject } from '@trezor/utils';

import { useDexExchangeTxSimulation } from './useDexExchangeTxSimulation';
import { useExchangeSignTransaction } from './useExchangeSignTransaction';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
} from '../../__tests__/tradingTestUtils';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('./useDexExchangeTxSimulation', () => ({
    useDexExchangeTxSimulation: jest.fn(),
}));

const mockUseDexExchangeTxSimulation = jest.mocked(useDexExchangeTxSimulation);

const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
    wallet: {
        accounts: [btc1NormalAccount],
        trading: {
            exchange: {
                tradingAccountKey: btc1NormalAccount.key,
                selectedQuote: mercuryoFixedWorstQuote,
            },
        },
        send: {
            precomposedTx: createPrecomposedTxFinal(),
        },
    },
};

type RenderUseExchangeSignTransactionParams = {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
    onSignTransactionNavigation?: () => void;
};

const renderUseExchangeSignTransaction = ({
    overrides = {},
    onSignTransactionNavigation = jest.fn(),
}: RenderUseExchangeSignTransactionParams = {}) => ({
    onSignTransactionNavigation,
    ...renderHookWithTradingProvider(
        () => useExchangeSignTransaction({ onSignTransactionNavigation }),
        {
            tradeType: 'exchange',
            overrides: mergeDeepObject(baseOverrides, overrides),
        },
    ),
});

describe('useExchangeSignTransaction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: undefined,
        });
    });

    it('returns state derived from the exchange and transaction', () => {
        const { result } = renderUseExchangeSignTransaction({
            overrides: {
                wallet: {
                    trading: {
                        exchange: {
                            selectedQuote: {
                                ...mercuryoFixedWorstQuote,
                                status: 'SUCCESS',
                            },
                        },
                    },
                },
            },
        });

        expect(result.current).toEqual(
            expect.objectContaining({
                isSignDataFlow: false,
                isTXFinalType: true,
                isTradeFinalized: true,
                isSigningPreparationLoading: false,
            }),
        );
    });

    it('navigates to outputs review with sign-data flow details', () => {
        const { result, onSignTransactionNavigation } = renderUseExchangeSignTransaction({
            overrides: {
                wallet: {
                    trading: {
                        exchange: {
                            formStep: 'SIGN_DATA',
                        },
                    },
                },
            },
        });

        act(() => {
            result.current.handleSignTransaction();
        });

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.TradingExchangeOutputsReview, {
            accountKey: btc1NormalAccount.key,
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            orderId: mercuryoFixedWorstQuote.orderId,
            flowType: 'sign-data',
        });
        expect(onSignTransactionNavigation).toHaveBeenCalledTimes(1);
    });

    it('does not navigate when the quote is missing', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { result, onSignTransactionNavigation } = renderUseExchangeSignTransaction({
            overrides: {
                wallet: {
                    trading: {
                        exchange: {
                            selectedQuote: undefined,
                        },
                    },
                },
            },
        });

        act(() => {
            result.current.handleSignTransaction();
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith('quote or fromAccount is not defined', {
            hasQuote: false,
            hasFromAccount: true,
        });
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(onSignTransactionNavigation).not.toHaveBeenCalled();
    });
});
