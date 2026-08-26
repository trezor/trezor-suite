import '@suite-common/test-utils/globalOverrides';

import { createIntl } from 'react-intl';

import { Translation, type TranslationKey, messages } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { configureMockStore, fireEvent, screen } from '@suite-common/test-utils';
import { type NotificationEntry } from '@suite-common/toast-notifications';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { NotificationRenderer } from './NotificationRenderer';
import { extraDependenciesDesktopMock } from '../../../../../mocks/extraDependenciesDesktopMock';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';
import { type NotificationViewProps } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

type LocalizedNotificationEntry = NotificationEntry<TranslationKey>;
type TradingErrorNotification = Extract<LocalizedNotificationEntry, { type: 'trading-error' }>;
type WrapNotification = Extract<LocalizedNotificationEntry, { type: 'tx-wrap' | 'tx-unwrap' }>;

const ethSymbol = asNetworkSymbol('eth');
const intl = createIntl({ locale: 'en' });

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

const NotificationViewProbe = ({ message, messageValues, variant }: NotificationViewProps) => (
    <div data-testid="notification-view" data-variant={variant}>
        <Translation id={message} values={messageValues} />
    </div>
);

const renderNotification = (notification: LocalizedNotificationEntry) => {
    const store = configureMockStore({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                accounts: [],
                transactions: {
                    transactions: {},
                    phishing: {},
                    fetchStatusDetail: {},
                },
            },
        },
        serializableCheck: { ignoredActions: [] },
    });

    return renderWithProviders(
        store,
        extraDependenciesDesktopMock.services,
        <NotificationRenderer render={NotificationViewProbe} notification={notification} />,
    );
};
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
    send: { symbol: ethSymbol, displaySymbol: 'ETH', amount: '1' },
    receive: { symbol: ethSymbol, displaySymbol: 'WETH', amount: '1' },
} as const;

const wrapToastPayload = {
    type: 'tx-wrap',
    metadata: wrapMetadata,
    descriptor: '0xdescriptor',
    symbol: ethSymbol,
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

describe('NotificationRenderer transaction lifecycle', () => {
    const transactionPayload = {
        context: 'toast' as const,
        id: 1,
        formattedAmount: '1 ETH',
        descriptor: 'descriptor',
        symbol: 'eth' as const,
        txid: 'txid',
    };

    it('renders a broadcast transaction as pending', () => {
        renderNotification({
            ...transactionPayload,
            type: 'tx-sent',
        });

        const notificationView = screen.getByTestId('notification-view');
        expect(notificationView).toHaveAttribute('data-variant', 'warning');
        expect(
            screen.getByText(intl.formatMessage(messages.TOAST_TX_SENT, { account: 'descriptor' })),
        ).toBeInTheDocument();
    });

    it('uses the approved staking pending and fee-bump copy', () => {
        const { unmount } = renderNotification({
            ...transactionPayload,
            type: 'tx-staked',
        });

        expect(
            screen.getByText(
                intl.formatMessage(messages.TOAST_TX_STAKED, { account: 'descriptor' }),
            ),
        ).toBeInTheDocument();

        unmount();
        renderNotification({
            ...transactionPayload,
            type: 'tx-staked',
            isFeeBump: true,
        });

        expect(
            screen.getByText(intl.formatMessage(messages.TOAST_TX_STAKE_BUMPED)),
        ).toBeInTheDocument();
    });

    it('renders a correlated staking confirmation as successful', () => {
        renderNotification({
            ...transactionPayload,
            type: 'tx-confirmed',
            sourceType: 'tx-staked',
        });

        const notificationView = screen.getByTestId('notification-view');
        expect(notificationView).toHaveAttribute('data-variant', 'success');
        expect(
            screen.getByText(intl.formatMessage(messages.TOAST_TX_STAKE_CONFIRMED)),
        ).toBeInTheDocument();
    });

    it('uses generic confirmation copy without a correlated broadcast', () => {
        renderNotification({
            ...transactionPayload,
            type: 'tx-confirmed',
        });

        expect(
            screen.getByText(
                intl.formatMessage(messages.TOAST_TX_CONFIRMED, { account: 'descriptor' }),
            ),
        ).toBeInTheDocument();
    });
});
