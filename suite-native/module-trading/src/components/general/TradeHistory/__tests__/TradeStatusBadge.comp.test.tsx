import { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import { TradingTransactionStatus } from '@suite-common/trading';
import { BadgeVariant } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { getBuyTrade, getExchangeTrade, getSellTrade } from '../../../../__fixtures__/trades';
import { TradeStatusBadge, getBadgeIconName, getBadgeVariant } from '../TradeStatusBadge';

describe('TradeStatusBadge', () => {
    it('should render nothing when status is undefined', () => {
        const { toJSON } = renderWithBasicProvider(<TradeStatusBadge status={undefined} />);

        expect(toJSON()).toBeNull();
    });

    it.each([
        ['SUCCESS', /Approved/],
        ['BLOCKED', /Blocked/],
        ['ERROR', /Rejected/],
        ['SUBMITTED', /Submitted/],
        ['LOGIN_REQUEST', /Pending/],
        ['REQUESTING', /Requesting/],
        ['APPROVAL_PENDING', /Approval pending/],
        ['WAITING_FOR_USER', /Waiting for user/],
    ] as [BuyTradeStatus, RegExp][])(
        'should render badge with correct text for buy trade and status %s',
        (status, expectedText) => {
            const buyTrade = getBuyTrade({ status });
            const { getByAccessibilityHint } = renderWithBasicProvider(
                <TradeStatusBadge status={buyTrade.data.status} />,
            );
            expect(getByAccessibilityHint('Trade status badge')).toHaveTextContent(expectedText);
        },
    );

    it.each([
        ['SUCCESS', /Approved/],
        ['KYC', /KYC/],
        ['ERROR', /Rejected/],
        ['LOADING', /Loading/],
        ['CONFIRM', /Confirm/],
        ['SENDING', /Sending/],
        ['CONFIRMING', /Confirming/],
        ['CONVERTING', /Converting/],
        ['APPROVAL_REQ', /Approval required/],
        ['APPROVAL_PENDING', /Approval pending/],
        ['SIGN_DATA', /Sign data/],
        ['PENDING', /Pending/],
    ] as [ExchangeTradeStatus, RegExp][])(
        'should render badge with correct text for exchange trade and status %s',
        (status, expectedText) => {
            const exchangeTrade = getExchangeTrade({ status });
            const { getByAccessibilityHint } = renderWithBasicProvider(
                <TradeStatusBadge status={exchangeTrade.data.status} />,
            );
            expect(getByAccessibilityHint('Trade status badge')).toHaveTextContent(expectedText);
        },
    );

    it.each([
        ['SUCCESS', /Approved/],
        ['BLOCKED', /Blocked/],
        ['ERROR', /Rejected/],
        ['CANCELLED', /Cancelled/],
        ['REFUNDED', /Refunded/],
        ['REQUESTING', /Requesting/],
        ['LOGIN_REQUEST', /Pending/],
        ['SITE_ACTION_REQUEST', /Site action requested/],
        ['SUBMITTED', /Submitted/],
        ['SEND_CRYPTO', /Send crypto/],
    ] as [SellTradeStatus, RegExp][])(
        'should render badge with correct text for sell trade and status %s',
        (status, expectedText) => {
            const sellTrade = getSellTrade({ status });
            const { getByAccessibilityHint } = renderWithBasicProvider(
                <TradeStatusBadge status={sellTrade.data.status} />,
            );
            expect(getByAccessibilityHint('Trade status badge')).toHaveTextContent(expectedText);
        },
    );

    describe('getBadgeVariant', () => {
        it.each([
            [undefined, 'neutral'],
            ['CANCELLED', 'neutral'],
            ['SUCCESS', 'greenSubtle'],
            ['REFUNDED', 'greenSubtle'],
            ['BLOCKED', 'red'],
            ['ERROR', 'red'],
            ['SUBMITTED', 'yellow'],
            ['CONVERTING', 'yellow'],
            ['KYC', 'yellow'],
        ] as [TradingTransactionStatus, BadgeVariant][])(
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

        it('should return x for CANCELLED, ERROR and BLOCKED status', () => {
            expect(getBadgeIconName('CANCELLED')).toBe('x');
            expect(getBadgeIconName('ERROR')).toBe('x');
            expect(getBadgeIconName('BLOCKED')).toBe('x');
        });

        it('should return check for SUCCESS and REFUNDED status', () => {
            expect(getBadgeIconName('SUCCESS')).toBe('check');
            expect(getBadgeIconName('REFUNDED')).toBe('check');
        });

        it('should return warning for KYC status', () => {
            expect(getBadgeIconName('KYC')).toBe('warning');
        });

        it('should return clock for pending statuses', () => {
            expect(getBadgeIconName('PENDING')).toBe('clock');
            expect(getBadgeIconName('APPROVAL_PENDING')).toBe('clock');
            expect(getBadgeIconName('CONFIRMING')).toBe('clock');
            expect(getBadgeIconName('SENDING')).toBe('clock');
            expect(getBadgeIconName('CONVERTING')).toBe('clock');
            expect(getBadgeIconName('WAITING_FOR_USER')).toBe('clock');
            expect(getBadgeIconName('SITE_ACTION_REQUEST')).toBe('clock');
        });

        it('should return undefined for other statuses', () => {
            expect(getBadgeIconName('SUBMITTED')).toBeUndefined();
        });
    });
});
