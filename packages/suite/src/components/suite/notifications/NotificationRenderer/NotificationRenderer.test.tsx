import '@suite-common/test-utils/globalOverrides';

import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { configureMockStore, fireEvent, screen } from '@suite-common/test-utils';
import { type NotificationEntry } from '@suite-common/toast-notifications';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { NotificationRenderer } from './NotificationRenderer';
import { extraDependenciesDesktopMock } from '../../../../../mocks/extraDependenciesDesktopMock';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';
import { type NotificationViewProps } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

type TradingErrorNotification = Extract<NotificationEntry, { type: 'trading-error' }>;
type WrapNotification = Extract<NotificationEntry, { type: 'tx-wrap' | 'tx-unwrap' }>;

const mockReport = jest.fn();

const MessageView = ({ message, messageValues }: NotificationViewProps) => (
    <Translation id={message} values={messageValues} />
);

// Stands in for ToastNotificationView, the only view that wires `onCancel`.
const DismissableView = ({ onCancel }: NotificationViewProps & { onCancel?: () => void }) => (
    <button type="button" onClick={onCancel}>
        dismiss
    </button>
);

const renderTradingError = (payload: Omit<TradingErrorNotification, 'context' | 'id'>) => {
    const notification: TradingErrorNotification = { context: 'toast', id: 0, ...payload };
    const store = configureMockStore({
        preloadedState: mockInitialAppState,
        serializableCheck: { ignoredActions: [] },
    });

    return renderWithProviders(
        store,
        extraDependenciesDesktopMock.services,
        <NotificationRenderer render={MessageView} notification={notification} />,
    );
};

const renderWrapToast = (payload: Omit<WrapNotification, 'context' | 'id'>) => {
    const notification = { context: 'toast', id: 0, ...payload } as WrapNotification;
    const store = configureMockStore({
        preloadedState: mockInitialAppState,
        serializableCheck: { ignoredActions: [] },
    });
    const services = {
        ...extraDependenciesDesktopMock.services,
        analytics: { ...extraDependenciesDesktopMock.services.analytics, report: mockReport },
    };

    renderWithProviders(
        store,
        services,
        <NotificationRenderer render={DismissableView} notification={notification} />,
    );

    fireEvent.click(screen.getByText('dismiss'));
};

const wrapMetadata = {
    send: { symbol: 'eth', displaySymbol: 'ETH', amount: '1' },
    receive: { symbol: 'eth', displaySymbol: 'WETH', amount: '1' },
} as const;

const wrapToastPayload = {
    type: 'tx-wrap',
    metadata: wrapMetadata,
    descriptor: '0xdescriptor',
    symbol: 'eth',
    txid: '0xwrap',
    formattedAmount: '1',
} as const;

describe('NotificationRenderer wrap toast dismissal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        ['tx-wrap', 'yieldWrapEvent'],
        ['tx-unwrap', 'yieldUnwrapEvent'],
    ] as const)('reports %s dismissal as sent/close', (type, eventKey) => {
        renderWrapToast({ ...wrapToastPayload, type });

        expect(mockReport).toHaveBeenCalledWith({
            type: events[eventKey].name,
            payload: { type: 'sent', action: 'close', networkSymbol: 'eth' },
        });
    });

    it('stays silent for an in-flow yield step', () => {
        renderWrapToast({ ...wrapToastPayload, isYieldFlowStep: true });

        expect(mockReport).not.toHaveBeenCalled();
    });
});

describe('NotificationRenderer trading-error', () => {
    it('step 1: renders the structured message when data is present, ignoring the partner message', () => {
        renderTradingError({
            type: 'trading-error',
            errorCode: 'invalid_pair',
            values: { send: 'BTC', receive: 'ETH' },
            message: 'raw provider noise that should not be shown',
        });

        expect(
            screen.getByText('This trading pair (BTC → ETH) is not supported.'),
        ).toBeInTheDocument();
        expect(screen.queryByText(/raw provider noise/)).not.toBeInTheDocument();
    });

    it('step 1: renders the structured amount message with its range', () => {
        renderTradingError({
            type: 'trading-error',
            errorCode: 'invalid_amount',
            values: { min: '0.001', max: '5' },
        });

        expect(
            screen.getByText('The amount is out of range. Minimum 0.001, maximum 5.'),
        ).toBeInTheDocument();
    });

    it('step 2: appends the partner message to the per-code base when data is missing', () => {
        renderTradingError({
            type: 'trading-error',
            errorCode: 'invalid_amount',
            message: 'minimal amount is 0.669',
        });

        expect(
            screen.getByText(
                'The amount is out of range. Message from partner: minimal amount is 0.669',
            ),
        ).toBeInTheDocument();
    });

    it('step 2: uses the global generic base for an unknown code with a partner message', () => {
        renderTradingError({
            type: 'trading-error',
            errorCode: 'unknown',
            message: 'Partner system down',
        });

        expect(
            screen.getByText(
                'An unexpected error occurred. Please try again. Message from partner: Partner system down',
            ),
        ).toBeInTheDocument();
    });

    it('step 3: renders the per-code base when neither data nor partner message is present', () => {
        renderTradingError({
            type: 'trading-error',
            errorCode: 'invalid_amount',
        });

        expect(screen.getByText('The amount is out of range.')).toBeInTheDocument();
    });

    it('step 4: renders the global generic for an unknown code with nothing to show', () => {
        renderTradingError({
            type: 'trading-error',
            errorCode: 'unknown',
        });

        expect(
            screen.getByText('An unexpected error occurred. Please try again.'),
        ).toBeInTheDocument();
    });

    it('falls back to the global generic for an unrecognized error code', () => {
        renderTradingError({
            type: 'trading-error',
            errorCode: 'totally_unknown_code',
        });

        expect(
            screen.getByText('An unexpected error occurred. Please try again.'),
        ).toBeInTheDocument();
    });

    it('renders the base for a code without a detailed template', () => {
        renderTradingError({
            type: 'trading-error',
            errorCode: 'no_response',
        });

        expect(
            screen.getByText('No response from the exchange. Please try again.'),
        ).toBeInTheDocument();
    });
});
