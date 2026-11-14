import '@suite-common/test-utils/globalOverrides';

import { act, waitFor } from '@testing-library/react';
import { type Coins, type CryptoId, type ExchangeProviderInfo } from 'invity-api';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { triggerWebDownloadFile } from '@suite-common/suite-utils';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type LoadTradingCatalogsThunkDeps,
    type TradingTransactionExchange,
    prepareTradingReducer,
    tradeApi,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { mockGetTradingEnvironment, mockTradingQueryClient } from '@suite-common/trading/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';
import { createDeferred } from '@trezor/utils';

import { renderHookWithProviders } from '#src/support/test-utils/hooksHelper';

import { useTradingHistoryExport } from './useTradingHistoryExport';
import { mockExtraDependenciesForReducers } from '../../../../../../mocks/mockExtraDependenciesForReducers';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/suite-utils', () => ({
    ...jest.requireActual('@suite-common/suite-utils'),
    triggerWebDownloadFile: jest.fn(),
}));

const triggerWebDownloadFileMock = jest.mocked(triggerWebDownloadFile);

const BITCOIN = 'bitcoin' as CryptoId;
const ETHEREUM = 'ethereum' as CryptoId;
const DEVICE_STATIC_SESSION_ID = 'descriptor@deviceId:0' as StaticSessionId;

const EXPECTED_HEADER =
    'Trade ID,Date and time,Type,Spent amount,Spend ticker,Spend network,Spend transaction ID,Receive amount,Receive ticker,Receive network,Provider,Status,Receive transaction ID,Payment ID';
const EXPECTED_ROW =
    'exchange-order,2026-01-03T00:00:00Z,swap,0.5,ETH,Ethereum,,0.02,BTC,Bitcoin,Changelly,SUCCESS,,';

const coins = {
    bitcoin: {
        symbol: 'btc',
        name: 'Bitcoin',
        coingeckoId: 'bitcoin',
        services: { buy: true, sell: true, exchange: true },
    },
    ethereum: {
        symbol: 'eth',
        name: 'Ethereum',
        coingeckoId: 'ethereum',
        services: { buy: true, sell: true, exchange: true },
    },
} satisfies Coins;

const changellyProvider: ExchangeProviderInfo = {
    name: 'changelly',
    companyName: 'Changelly',
    logo: 'changelly.svg',
    isActive: true,
    isFixedRate: false,
    isDex: false,
    buyTickers: [],
    sellTickers: [],
    addressFormats: {},
    statusUrl: 'https://changelly.com/status',
    supportUrl: 'https://changelly.com/support',
    kycUrl: 'https://changelly.com/kyc',
    kycPolicy: 'No KYC required',
    kycPolicyType: 'noKYC',
};

const selectedDevice = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
});

const ethAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('ethDescriptor'),
    deviceState: DEVICE_STATIC_SESSION_ID,
});

const exchange: TradingTransactionExchange = {
    tradeType: 'exchange',
    key: 'exchange-key',
    date: '2026-01-03T00:00:00Z',
    data: {
        orderId: 'exchange-order',
        status: 'SUCCESS',
        exchange: 'changelly',
        sendStringAmount: '0.5',
        send: ETHEREUM,
        receiveStringAmount: '0.02',
        receive: BITCOIN,
    },
    sendAccountKey: ethAccount.key,
    receiveAccountKey: ethAccount.key,
};

const exchangeInfo = {
    providerInfos: { changelly: changellyProvider },
    buyCryptoIds: [],
    sellCryptoIds: [],
};

const buildState = (): MockSuiteState => ({
    ...mockInitialAppState,
    device: { ...mockInitialAppState.device, selectedDevice },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [ethAccount],
        trading: {
            ...tradingInitialState,
            info: { ...tradingInitialState.info, coins },
            exchange: { ...tradingInitialState.exchange, exchangeInfo },
            trades: [exchange],
        },
    },
});

const tradingReducer = prepareTradingReducer(mockExtraDependenciesForReducers);

const renderExport = (state = buildState()) => {
    const { services } = createTestCompositionRoot<LoadTradingCatalogsThunkDeps, MockSuiteState>({
        // Only the trading state changes, when the export saves the catalogs it loaded.
        reducer: (currentState = state, action) => ({
            ...currentState,
            wallet: {
                ...currentState.wallet,
                trading: tradingReducer(currentState.wallet.trading, action),
            },
        }),
        preloadedState: state,
        services: () => ({
            getTradingEnvironment: mockGetTradingEnvironment(),
            queryClient: mockTradingQueryClient(),
        }),
    });
    const { result } = renderHookWithProviders(services, () => useTradingHistoryExport());

    return {
        result,
        exportTradeHistory: () =>
            act(() => {
                result.current.mutate();
            }),
        getActions: () => services.store.getActions(),
    };
};

const getDownloadedFile = () => {
    const call = triggerWebDownloadFileMock.mock.calls.at(0);

    if (!call) {
        throw new Error('Nothing was downloaded.');
    }

    const [blob, fileName] = call;

    if (!(blob instanceof Blob)) {
        throw new Error('The downloaded file is not a Blob.');
    }

    return { blob, fileName };
};

const waitForDownloadedFile = () => waitFor(getDownloadedFile);

// `readAsText` strips the CSV's leading BOM, which is asserted in `tradeHistoryExportUtils.test.ts`.
const readBlobText = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });

describe('useTradingHistoryExport', () => {
    beforeEach(() => {
        triggerWebDownloadFileMock.mockClear();
        triggerWebDownloadFileMock.mockImplementation(() => {});
        jest.spyOn(tradeApi, 'getInfo').mockResolvedValue({
            coins,
            platforms: {},
            config: { btcSwapComposeTemplate: { extraOutputs: [] } },
        });
        jest.spyOn(tradeApi, 'getExchangeList').mockResolvedValue([changellyProvider]);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('builds a CSV with translated column labels and a row per trade', async () => {
        const { exportTradeHistory } = renderExport();

        exportTradeHistory();

        const csvContent = await readBlobText((await waitForDownloadedFile()).blob);

        expect(csvContent).toBe(`${EXPECTED_HEADER}\n${EXPECTED_ROW}`);
    });

    it("loads the catalogs of the trades' sections before naming their providers", async () => {
        const state = buildState();
        const { exportTradeHistory } = renderExport({
            ...state,
            wallet: {
                ...state.wallet,
                trading: { ...state.wallet.trading, exchange: tradingInitialState.exchange },
            },
        });

        const getBuyList = jest.spyOn(tradeApi, 'getBuyList').mockResolvedValue(undefined);

        exportTradeHistory();

        const csvContent = await readBlobText((await waitForDownloadedFile()).blob);

        expect(csvContent).toBe(`${EXPECTED_HEADER}\n${EXPECTED_ROW}`);
        expect(getBuyList).not.toHaveBeenCalled();
    });

    it('reports the export as pending until the catalogs load', async () => {
        const pendingExchangeList =
            createDeferred<Awaited<ReturnType<typeof tradeApi.getExchangeList>>>();
        jest.spyOn(tradeApi, 'getExchangeList').mockReturnValue(pendingExchangeList.promise);
        const { result, exportTradeHistory } = renderExport();

        exportTradeHistory();

        await waitFor(() => expect(result.current.isPending).toBe(true));
        expect(triggerWebDownloadFileMock).not.toHaveBeenCalled();

        await act(() => pendingExchangeList.resolve([changellyProvider]));

        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(triggerWebDownloadFileMock).toHaveBeenCalledTimes(1);
    });

    it('downloads the CSV under a file name stamped with the export time', async () => {
        const { exportTradeHistory } = renderExport();

        exportTradeHistory();

        const { blob, fileName } = await waitForDownloadedFile();

        expect(blob.type).toBe('text/csv;charset=utf-8');
        expect(fileName).toMatch(/^trade_history_\d{8}T\d{6}\.csv$/);
    });

    it('shows an error toast when the download fails', async () => {
        triggerWebDownloadFileMock.mockImplementation(() => {
            throw new Error('download failed');
        });
        const { exportTradeHistory, getActions } = renderExport();

        exportTradeHistory();

        await waitFor(() =>
            expect(getActions()).toContainEqual(
                expect.objectContaining({
                    type: notificationsActions.addToast.type,
                    payload: expect.objectContaining({ type: 'error', error: 'Export failed' }),
                }),
            ),
        );
    });
});
