import { type TradingTransactionStatus } from '@suite-common/trading';
import { type BadgeIntent } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { getBuyTrade, getExchangeTrade, getSellTrade } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { TradeStatusBadge, getBadgeIconName, getBadgeVariant } from '../TradeStatusBadge';

describe('TradeStatusBadge', () => {
    it('should render nothing when status is undefined', () => {
        const { toJSON } = renderWithTradingProvider(<TradeStatusBadge status={undefined} />);

        expect(toJSON()).toBeNull();
    });

    it.each([
        ['SUCCESS', 'success'],
        ['BLOCKED', 'blocked'],
        ['ERROR', 'error'],
        ['SUBMITTED', 'submitted'],
        ['LOGIN_REQUEST', 'loginRequest'],
        ['REQUESTING', 'requesting'],
        ['APPROVAL_PENDING', 'approvalPending'],
        ['WAITING_FOR_USER', 'waitingForUser'],
    ] as const)(
        'should render badge with correct text for buy trade and status %s',
        (status, statusKey) => {
            const buyTrade = getBuyTrade({ status });
            const { getByAccessibilityHint } = renderWithTradingProvider(
                <TradeStatusBadge status={buyTrade.data.status} />,
            );
            const expectedText = new RegExp(
                getTranslation(`moduleTrading.tradeHistory.status.${statusKey}`),
            );
            expect(getByAccessibilityHint('Trade status badge')).toHaveTextContent(expectedText);
        },
    );

    it.each([
        ['SUCCESS', 'success'],
        ['KYC', 'kyc'],
        ['ERROR', 'error'],
        ['LOADING', 'loading'],
        ['CONFIRM', 'confirm'],
        ['SENDING', 'sending'],
        ['CONFIRMING', 'confirming'],
        ['CONVERTING', 'converting'],
        ['APPROVAL_REQ', 'ApprovalRequired'],
        ['APPROVAL_PENDING', 'approvalPending'],
        ['SIGN_DATA', 'signData'],
    ] as const)(
        'should render badge with correct text for exchange trade and status %s',
        (status, statusKey) => {
            const exchangeTrade = getExchangeTrade({ status });
            const { getByAccessibilityHint } = renderWithTradingProvider(
                <TradeStatusBadge status={exchangeTrade.data.status} />,
            );
            const expectedText = new RegExp(
                getTranslation(`moduleTrading.tradeHistory.status.${statusKey}`),
            );
            expect(getByAccessibilityHint('Trade status badge')).toHaveTextContent(expectedText);
        },
    );

    it.each([
        ['SUCCESS', 'success'],
        ['BLOCKED', 'blocked'],
        ['ERROR', 'error'],
        ['CANCELLED', 'cancelled'],
        ['REFUNDED', 'refunded'],
        ['REQUESTING', 'requesting'],
        ['LOGIN_REQUEST', 'loginRequest'],
        ['SITE_ACTION_REQUEST', 'siteActionRequest'],
        ['SUBMITTED', 'submitted'],
    ] as const)(
        'should render badge with correct text for sell trade and status %s',
        (status, statusKey) => {
            const sellTrade = getSellTrade({ status });
            const { getByAccessibilityHint } = renderWithTradingProvider(
                <TradeStatusBadge status={sellTrade.data.status} />,
            );
            const expectedText = new RegExp(
                getTranslation(`moduleTrading.tradeHistory.status.${statusKey}`),
            );
            expect(getByAccessibilityHint('Trade status badge')).toHaveTextContent(expectedText);
        },
    );

    describe('getBadgeVariant', () => {
        it.each([
            [undefined, 'neutral'],
            ['CANCELLED', 'warning'],
            ['SUCCESS', 'brand'],
            ['REFUNDED', 'critical'],
            ['BLOCKED', 'critical'],
            ['ERROR', 'critical'],
            ['SUBMITTED', 'warning'],
            ['CONVERTING', 'warning'],
            ['KYC', 'warning'],
        ] as [TradingTransactionStatus, BadgeIntent][])(
            'should render badge with correct text for status %s',
            (status, expectedVariant) => {
                expect(getBadgeVariant(status)).toBe(expectedVariant);
            },
        );
    });

    describe('getBadgeIconName', () => {
        it('should return undefined for undefined status', () => {
            expect(getBadgeIconName(undefined)).toBeUndefined();
        });

        it('should return warningCircle for CANCELLED, ERROR, REFUNDED and BLOCKED status', () => {
            expect(getBadgeIconName('ERROR')).toBe('warningCircle');
            expect(getBadgeIconName('BLOCKED')).toBe('warningCircle');
            expect(getBadgeIconName('REFUNDED')).toBe('warningCircle');
        });

        it('should return check for SUCCESS  status', () => {
            expect(getBadgeIconName('SUCCESS')).toBe('check');
        });

        it('should return warning for KYC and CANCELLED status', () => {
            expect(getBadgeIconName('CANCELLED')).toBe('warning');
            expect(getBadgeIconName('KYC')).toBe('warning');
        });

        it('should return undefined for other statuses', () => {
            expect(getBadgeIconName('PENDING')).toBeUndefined();
            expect(getBadgeIconName('APPROVAL_PENDING')).toBeUndefined();
            expect(getBadgeIconName('CONFIRMING')).toBeUndefined();
            expect(getBadgeIconName('SENDING')).toBeUndefined();
            expect(getBadgeIconName('CONVERTING')).toBeUndefined();
            expect(getBadgeIconName('WAITING_FOR_USER')).toBeUndefined();
            expect(getBadgeIconName('SITE_ACTION_REQUEST')).toBeUndefined();
            expect(getBadgeIconName('SUBMITTED')).toBeUndefined();
        });
    });
});
