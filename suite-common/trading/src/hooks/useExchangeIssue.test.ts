import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { type Account } from '@suite-common/wallet-types';

import { useDexExchangeTxSimulation } from './useDexExchangeTxSimulation';
import { useExchangeFiatDeviation } from './useExchangeFiatDeviation';
import { useExchangeIssue } from './useExchangeIssue';
import { accountEth } from '../__fixtures__/utils';
import { createTradingTestState, renderHookWithTradingStore } from '../__tests__/testUtils';
import { initialState } from '../reducers/tradingCommonReducer';

type SimulationResult = NonNullable<ReturnType<typeof useDexExchangeTxSimulation>['data']>;
type SimulationPayload = Pick<SimulationResult['payload'], 'validation' | 'simulation'>;

jest.mock('./useDexExchangeTxSimulation', () => ({
    useDexExchangeTxSimulation: jest.fn(),
}));

jest.mock('./useExchangeFiatDeviation', () => ({
    useExchangeFiatDeviation: jest.fn(),
}));

const mockUseDexExchangeTxSimulation = jest.mocked(useDexExchangeTxSimulation);
const mockUseExchangeFiatDeviation = jest.mocked(useExchangeFiatDeviation);

// Contract-less receive crypto id so the NATIVE asset diff of the simulation matches it.
const selectedQuote: ExchangeTrade = {
    exchange: 'changelly',
    receive: 'bitcoin' as CryptoId,
    receiveStringAmount: '0.0609979',
    send: 'litecoin' as CryptoId,
    sendStringAmount: '12',
};
const account = accountEth as Account;

const defaultParams = {
    account,
    isEnabled: true,
    sourceOrigin: 'test-origin',
};

const createSimulationResult = (scan: SimulationPayload): SimulationResult => ({
    method: 'ethereumSignTransaction',
    payload: { block: '123', chain: 'ethereum', needsDisclaimer: false, ...scan },
});

const maliciousResult = createSimulationResult({
    validation: {
        status: 'Success',
        result_type: 'Malicious',
        description: 'Flagged as malicious',
        features: [],
    },
});

// A successful simulation where the account receives exactly 1 unit of the
// native asset — matched by the quote's contract-less receive crypto id.
const successResultWithNativeReceive = createSimulationResult({
    simulation: {
        status: 'Success',
        account_summary: {
            assets_diffs: [
                {
                    asset_type: 'NATIVE',
                    asset: { type: 'NATIVE', chain_id: 1, chain_name: 'ethereum', decimals: 18 },
                    in: [{ raw_value: '0xde0b6b3a7640000', value: '1' }],
                    out: [],
                },
            ],
        },
    } as unknown as SimulationPayload['simulation'],
});

const renderUseExchangeIssue = () =>
    renderHookWithTradingStore(() => useExchangeIssue(defaultParams), {
        preloadedState: createTradingTestState({
            exchange: { ...initialState.exchange, selectedQuote },
        }),
    });

describe('useExchangeIssue', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: undefined,
        });
        mockUseExchangeFiatDeviation.mockReturnValue(null);
    });

    it('passes the simulation state through and reports no issue by default', () => {
        const { result } = renderUseExchangeIssue();

        expect(result.current).toEqual({
            isSimulationEnabled: true,
            isSimulationLoading: false,
            issue: null,
        });
    });

    it('forwards the simulation params to useDexExchangeTxSimulation', () => {
        renderUseExchangeIssue();

        expect(mockUseDexExchangeTxSimulation).toHaveBeenCalledWith(defaultParams);
    });

    it('reports a high-risk issue for a malicious verdict', () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: maliciousResult,
        });

        const { result } = renderUseExchangeIssue();

        expect(result.current.issue).toMatchObject({ type: 'high-risk', severity: 'critical' });
    });

    it('reports a price impact from the fiat deviation', () => {
        mockUseExchangeFiatDeviation.mockReturnValue({
            deviation: 0.15,
            exceedsThreshold: true,
            exceedsHighThreshold: false,
        });

        const { result } = renderUseExchangeIssue();

        expect(result.current.issue).toEqual({
            type: 'price-impact',
            severity: 'warning',
            deviation: 0.15,
        });
    });

    it('feeds the simulated receive amount, quote data, and base currency into the fiat deviation', () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: successResultWithNativeReceive,
        });

        renderUseExchangeIssue();

        expect(mockUseExchangeFiatDeviation).toHaveBeenCalledWith({
            fiatCurrency: 'usd',
            receiveAmount: '1',
            receiveCryptoId: selectedQuote.receive,
            sendAmount: selectedQuote.sendStringAmount,
            sendCryptoId: selectedQuote.send,
        });
    });
});
