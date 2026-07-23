import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { useTxSimulation } from '@suite-common/tx-simulation';
import { getNetwork } from '@suite-common/wallet-config';
import { type TxSimulationAction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { createTradingTestState, renderHookWithTradingStore } from '../../__tests__/testUtils';
import { initialState } from '../../reducers/tradingCommonReducer';
import { composeDexTxSimulationAction } from '../../utils/exchange/composeDexTxSimulationAction';
import { useDexExchangeTxSimulation } from '../useDexExchangeTxSimulation';

jest.mock('@suite-common/tx-simulation', () => ({
    useTxSimulation: jest.fn(),
}));

jest.mock('../../utils/exchange/composeDexTxSimulationAction', () => ({
    composeDexTxSimulationAction: jest.fn(),
}));

const mockedUseTxSimulation = jest.mocked(useTxSimulation);
const mockedComposeDexTxSimulationAction = jest.mocked(composeDexTxSimulationAction);

const SOURCE_ORIGIN = 'https://example.com';
const account = mockWalletAccount({ symbol: 'eth' });
const quote: ExchangeTrade = {
    send: 'ethereum' as CryptoId,
    sendStringAmount: '1',
    receive: 'bitcoin' as CryptoId,
    receiveStringAmount: '0.05',
    rate: 0.05,
    min: 0,
    max: 'NONE',
    fee: 'UNKNOWN',
    exchange: 'provider',
    isDex: true,
};
const action: TxSimulationAction = {
    method: 'ethereumSignTransaction',
    fromAddress: account.descriptor,
    sourceOrigin: SOURCE_ORIGIN,
    payload: {
        path: account.path,
        transaction: {
            to: account.descriptor,
            value: '0x0',
            data: '0x',
            chainId: 1,
            nonce: '0',
            gasLimit: '0x0',
            maxFeePerGas: '0x0',
            maxPriorityFeePerGas: '0x0',
        },
    },
};

describe('useDexExchangeTxSimulation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does not compose or run a simulation when disabled', () => {
        mockedUseTxSimulation.mockReturnValue(null);

        const { result } = renderHookWithTradingStore(() =>
            useDexExchangeTxSimulation({ account, isEnabled: false, sourceOrigin: SOURCE_ORIGIN }),
        );

        expect(mockedComposeDexTxSimulationAction).not.toHaveBeenCalled();
        expect(mockedUseTxSimulation).toHaveBeenCalledWith(null);
        expect(result.current).toEqual({
            isEnabled: false,
            isLoading: false,
            error: null,
            data: undefined,
        });
    });

    it('composes the action and exposes the simulation state when enabled', () => {
        const txSimulationQuery = {
            isLoading: true,
            error: null,
            data: undefined,
        } satisfies Pick<
            NonNullable<ReturnType<typeof useTxSimulation>>['txSimulationQuery'],
            'isLoading' | 'error' | 'data'
        >;

        mockedComposeDexTxSimulationAction.mockReturnValue(action);
        mockedUseTxSimulation.mockReturnValue({
            txSimulationQuery,
            network: getNetwork('eth'),
            targetContract: account.descriptor,
        } as unknown as NonNullable<ReturnType<typeof useTxSimulation>>);

        const { result } = renderHookWithTradingStore(
            () =>
                useDexExchangeTxSimulation({
                    account,
                    isEnabled: true,
                    sourceOrigin: SOURCE_ORIGIN,
                }),
            {
                preloadedState: createTradingTestState({
                    exchange: { ...initialState.exchange, selectedQuote: quote },
                }),
            },
        );

        expect(mockedComposeDexTxSimulationAction).toHaveBeenCalledWith({
            quote,
            account,
            sourceOrigin: SOURCE_ORIGIN,
        });
        expect(mockedUseTxSimulation).toHaveBeenCalledWith(action);
        expect(result.current).toEqual({
            isEnabled: true,
            isLoading: true,
            error: null,
            data: undefined,
        });
    });
});
