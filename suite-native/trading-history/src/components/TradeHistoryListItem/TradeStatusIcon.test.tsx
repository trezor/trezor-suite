import { TradeStatusIcon, getTradeStatusIconConfig } from './TradeStatusIcon';
import { renderWithTradingHistoryProvider } from '../../__tests__/tradingHistoryTestUtils';

describe('TradeStatusIcon', () => {
    it.each([
        ['SUCCESS', 'check', 'brand'],
        ['ERROR', 'warningCircle', 'critical'],
        ['BLOCKED', 'warningCircle', 'critical'],
        ['REFUNDED', 'warningCircle', 'critical'],
        ['CANCELLED', 'warning', 'warning'],
        ['KYC', 'warning', 'warning'],
        ['SUBMITTED', 'spinner', 'warning'],
        ['CONVERTING', 'spinner', 'warning'],
    ] as const)('maps %s to %s with %s intent', (status, iconName, intent) => {
        expect(getTradeStatusIconConfig(status)).toMatchObject({ iconName, intent });
    });

    it.each([
        'LOGIN_REQUEST',
        'REQUESTING',
        'APPROVAL_PENDING',
        'WAITING_FOR_USER',
        'SITE_ACTION_REQUEST',
        'SEND_CRYPTO',
        'PENDING',
        'LOADING',
        'CONFIRM',
        'SENDING',
        'CONFIRMING',
        'APPROVAL_REQ',
        'SIGN_DATA',
    ] as const)('maps %s to the spinner', status => {
        expect(getTradeStatusIconConfig(status)).toMatchObject({
            iconName: 'spinner',
            intent: 'warning',
        });
    });

    it('renders no icon for an undefined status', () => {
        expect(getTradeStatusIconConfig(undefined)).toBeUndefined();

        const { toJSON } = renderWithTradingHistoryProvider(<TradeStatusIcon status={undefined} />);

        expect(toJSON()).toBeNull();
    });

    it.each([
        ['SUCCESS', 'Successful trade'],
        ['ERROR', 'Failed trade'],
        ['CANCELLED', 'Trade requires attention'],
        ['SUBMITTED', 'Trade in progress'],
    ] as const)('provides an accessible label for %s', (status, label) => {
        const { getByLabelText } = renderWithTradingHistoryProvider(
            <TradeStatusIcon status={status} />,
        );

        expect(getByLabelText(label)).toBeTruthy();
    });
});
