import type { CryptoId, ExchangeTrade } from 'invity-api';

import type { NetworkTxSimulationResult } from '@suite-common/tx-simulation';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';
import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { useDexExchangeTxSimulation } from './useDexExchangeTxSimulation';
import { useExchangeReceiveAmount } from './useExchangeReceiveAmount';

jest.mock('./useDexExchangeTxSimulation', () => ({
    useDexExchangeTxSimulation: jest.fn(),
}));

const mockUseDexExchangeTxSimulation = jest.mocked(useDexExchangeTxSimulation);

const simulationResult = {
    method: 'ethereumSignTransaction',
    payload: {
        needsDisclaimer: false,
        simulation: {
            status: 'Success',
            account_summary: {
                assets_diffs: [
                    {
                        asset_type: 'NATIVE',
                        asset: {
                            type: 'NATIVE',
                            chain_id: 1,
                            chain_name: 'ethereum',
                            decimals: 18,
                        },
                        in: [{ raw_value: '0xde0b6b3a7640000', value: '1' }],
                        out: [],
                    },
                ],
            },
        },
    },
} as unknown as NetworkTxSimulationResult;

describe('useExchangeReceiveAmount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: undefined,
        });
    });

    it('returns the quote receive amount when simulation data is unavailable', async () => {
        const { result } = await renderHookWithBasicProvider(() =>
            useExchangeReceiveAmount(mercuryoFixedWorstQuote),
        );

        expect(result.current.receiveAmount).toBe(mercuryoFixedWorstQuote.receiveStringAmount);
    });

    it('prefers the simulated receive amount', async () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: simulationResult,
        });

        const { result } = await renderHookWithBasicProvider(() =>
            useExchangeReceiveAmount(mercuryoFixedWorstQuote),
        );

        expect(result.current.receiveAmount).toBe('1');
    });

    it('returns 0 when a same-chain swap simulation shows no incoming receive asset', async () => {
        const sameChainQuote: ExchangeTrade = {
            ...mercuryoFixedWorstQuote,
            receive: 'ethereum' as CryptoId,
        };
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: {
                method: 'ethereumSignTransaction',
                payload: {
                    needsDisclaimer: false,
                    simulation: { status: 'Success', account_summary: { assets_diffs: [] } },
                },
            } as unknown as NetworkTxSimulationResult,
        });

        const { result } = await renderHookWithBasicProvider(() =>
            useExchangeReceiveAmount(sameChainQuote),
        );

        expect(result.current.receiveAmount).toBe('0');
    });
});
