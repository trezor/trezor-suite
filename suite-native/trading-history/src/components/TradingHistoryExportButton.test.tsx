import { act, fireEvent, screen } from '@suite-native/test-utils-store';
import { accounts, getBuyTrade } from '@suite-native/trading-fixtures';

import { exportTradingHistoryCsv } from '../exportTradingHistoryCsv';
import { TradingHistoryExportButton } from './TradingHistoryExportButton';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingHistoryProvider,
} from '../test-utils/tradingHistoryTestUtils';

const mockShowAlert = jest.fn();
const mockHideAlert = jest.fn();
const mockShowToast = jest.fn();

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({ showAlert: mockShowAlert, hideAlert: mockHideAlert }),
}));

jest.mock('@suite-native/toasts', () => ({
    ...jest.requireActual('@suite-native/toasts'),
    useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock('../exportTradingHistoryCsv', () => ({
    exportTradingHistoryCsv: jest.fn(),
}));

const mockExportTradingHistoryCsv = jest.mocked(exportTradingHistoryCsv);

const getOverrides = (
    trades: TradingTestPreloadedState['wallet']['trading']['trades'],
): PreloadedStatePartial<TradingTestPreloadedState> => ({
    device: {
        devices: [],
        selectedDevice: {
            state: {
                staticSessionId: '1@2:3',
            },
        },
    },
    wallet: {
        trading: {
            trades,
        },
        accounts,
    },
});

describe('TradingHistoryExportButton', () => {
    const renderExportButton = async ({
        trades = [getBuyTrade({ status: 'SUCCESS' })],
    }: {
        trades?: TradingTestPreloadedState['wallet']['trading']['trades'];
    } = {}) =>
        await renderWithTradingHistoryProvider(<TradingHistoryExportButton />, {
            overrides: getOverrides(trades),
        });

    const confirmExport = async () => {
        await fireEvent.press(screen.getByTestId('@trading/history/export-button'));
        await act(() => mockShowAlert.mock.calls[0]![0].onPressPrimaryButton());
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockExportTradingHistoryCsv.mockResolvedValue({ success: true });
    });

    it('renders nothing when the device has no trades', async () => {
        await renderExportButton({ trades: [] });

        expect(screen.queryByTestId('@trading/history/export-button')).toBeNull();
    });

    it('renders the export button when the device has trades', async () => {
        await renderExportButton();

        expect(screen.getByTestId('@trading/history/export-button')).toBeOnTheScreen();
    });

    it('opens a confirmation alert instead of exporting immediately', async () => {
        await renderExportButton();

        await fireEvent.press(screen.getByTestId('@trading/history/export-button'));

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
        expect(mockExportTradingHistoryCsv).not.toHaveBeenCalled();

        const alert = mockShowAlert.mock.calls[0]![0];
        expect(alert.pictogramVariant).toBe('success');
        expect(alert.icon).toBe('downloadSimple');
        expect(alert.title.props.id).toBe('moduleTrading.tradeHistory.export.button');
        expect(alert.primaryButtonTitle.props.id).toBe(
            'moduleTrading.tradeHistory.export.confirmButton',
        );
        expect(alert.secondaryButtonTitle.props.id).toBe('generic.buttons.cancel');
        expect(alert.onPressSecondaryButton).toBe(mockHideAlert);
    });

    it('exports the CSV and shows a success toast when the download is confirmed', async () => {
        await renderExportButton();

        await confirmExport();

        expect(mockExportTradingHistoryCsv).toHaveBeenCalledTimes(1);
        const [csvContent] = mockExportTradingHistoryCsv.mock.calls[0]!;
        expect(csvContent.split('\n')).toHaveLength(2);

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ intent: 'neutral', icon: 'check' }),
        );
        expect(mockShowToast.mock.calls[0]![0].message.props.id).toBe(
            'moduleTrading.tradeHistory.export.exportSuccessfulToast',
        );
    });

    it('shows a critical toast when the export fails', async () => {
        mockExportTradingHistoryCsv.mockResolvedValue({ success: false, reason: 'exportFailed' });
        await renderExportButton();

        await confirmExport();

        expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ intent: 'critical' }));
        expect(mockShowToast.mock.calls[0]![0].message.props.id).toBe(
            'moduleTrading.tradeHistory.export.exportFailedToast',
        );
    });

    it('shows a critical toast when the export throws an error', async () => {
        mockExportTradingHistoryCsv.mockRejectedValue(new Error('unexpected failure'));
        await renderExportButton();

        await confirmExport();

        expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ intent: 'critical' }));
        expect(mockShowToast.mock.calls[0]![0].message.props.id).toBe(
            'moduleTrading.tradeHistory.export.exportFailedToast',
        );
    });

    it('shows a critical toast when file saving is not supported', async () => {
        mockExportTradingHistoryCsv.mockResolvedValue({
            success: false,
            reason: 'fileSavingNotSupported',
        });
        await renderExportButton();

        await confirmExport();

        expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ intent: 'critical' }));
        expect(mockShowToast.mock.calls[0]![0].message.props.id).toBe(
            'moduleTrading.tradeHistory.export.fileSavingNotSupportedToast',
        );
    });

    it('shows no toast when the export is cancelled by dismissing the directory picker', async () => {
        mockExportTradingHistoryCsv.mockResolvedValue({ success: false, reason: 'cancelled' });
        await renderExportButton();

        await confirmExport();

        expect(mockExportTradingHistoryCsv).toHaveBeenCalledTimes(1);
        expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('dismisses the alert without exporting when cancelled', async () => {
        await renderExportButton();

        await fireEvent.press(screen.getByTestId('@trading/history/export-button'));
        mockShowAlert.mock.calls[0]![0].onPressSecondaryButton();

        expect(mockHideAlert).toHaveBeenCalledTimes(1);
        expect(mockExportTradingHistoryCsv).not.toHaveBeenCalled();
    });
});
