import '@suite-common/test-utils/globalOverrides';

import { type Coins, type CryptoId, type ExchangeProviderInfo } from 'invity-api';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { triggerWebDownloadFile } from '@suite-common/suite-utils';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingTransactionExchange,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { renderHookWithProviders } from 'src/support/test-utils/hooksHelper';

import { useTradingHistoryExport } from './useTradingHistoryExport';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

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
    symbol: 'eth',
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

const buildState = (): AppState => ({
    ...mockInitialAppState,
    device: { ...mockInitialAppState.device, selectedDevice },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [ethAccount],
        trading: {
            ...tradingInitialState,
            info: { ...tradingInitialState.info, coins },
            exchange: {
                ...tradingInitialState.exchange,
                exchangeInfo: {
                    providerInfos: { changelly: changellyProvider },
                    buyCryptoIds: [],
                    sellCryptoIds: [],
                },
            },
            trades: [exchange],
        },
    },
});

const renderExport = () => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: buildState(),
    });
    const { result } = renderHookWithProviders(root, () => useTradingHistoryExport());

    return {
        exportTradeHistory: () => result.current(),
        getActions: () => root.services.getActions(),
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
    });

    it('builds a CSV with translated column labels and a row per trade', async () => {
        const { exportTradeHistory } = renderExport();

        exportTradeHistory();

        const csvContent = await readBlobText(getDownloadedFile().blob);

        expect(csvContent).toBe(`${EXPECTED_HEADER}\n${EXPECTED_ROW}`);
    });

    it('downloads the CSV under a file name stamped with the export time', () => {
        const { exportTradeHistory } = renderExport();

        exportTradeHistory();

        const { blob, fileName } = getDownloadedFile();

        expect(blob.type).toBe('text/csv;charset=utf-8');
        expect(fileName).toMatch(/^trade_history_\d{8}T\d{6}\.csv$/);
    });

    it('shows an error toast when the download fails', () => {
        triggerWebDownloadFileMock.mockImplementation(() => {
            throw new Error('download failed');
        });
        const { exportTradeHistory, getActions } = renderExport();

        exportTradeHistory();

        expect(getActions()).toContainEqual(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({ type: 'error', error: 'Export failed' }),
            }),
        );
    });
});
