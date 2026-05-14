import { type TradingTransaction } from '@suite-common/trading';
import { type TxKeyPath, getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getBuyTrade, getInitializedTradingState } from '@suite-native/trading-fixtures';

import { type TradeStatusStep } from '../../../../utils/general/utils';
import { TradeDetailAlert } from '../TradeDetailAlert';

const mockOpenBrowser = jest.fn();

jest.mock('@suite-native/trading-browser-auth', () => ({
    ...jest.requireActual('@suite-native/trading-browser-auth'),
    useBrowserAuth: () => ({
        openBrowser: mockOpenBrowser,
    }),
}));

type AlertLabelsCase = {
    alertType: TradeStatusStep;
    titleKey: TxKeyPath;
    descriptionKey: TxKeyPath;
};

const alertLabelsCases: AlertLabelsCase[] = [
    {
        alertType: 'error',
        titleKey: 'moduleTrading.tradeHistory.detail.errorAlert.title',
        descriptionKey: 'moduleTrading.tradeHistory.detail.errorAlert.description',
    },
    {
        alertType: 'waiting',
        titleKey: 'moduleTrading.tradeHistory.detail.waitingAlert.title',
        descriptionKey: 'moduleTrading.tradeHistory.detail.waitingAlert.description',
    },
    {
        alertType: 'converting',
        titleKey: 'moduleTrading.tradeHistory.detail.convertingAlert.title',
        descriptionKey: 'moduleTrading.tradeHistory.detail.convertingAlert.description',
    },
    {
        alertType: 'kyc',
        titleKey: 'moduleTrading.tradeHistory.detail.kycAlert.title',
        descriptionKey: 'moduleTrading.tradeHistory.detail.kycAlert.description',
    },
    {
        alertType: 'sending',
        titleKey: 'moduleTrading.tradeHistory.detail.sendingAlert.title',
        descriptionKey: 'moduleTrading.tradeHistory.detail.sendingAlert.description',
    },
];

const renderAlert = ({
    alertType,
    trade = getBuyTrade({ status: 'SUBMITTED' }),
}: {
    alertType: TradeStatusStep;
    trade?: TradingTransaction;
}) =>
    renderWithStoreProvider(
        <TradeDetailAlert alertType={alertType} orderId={trade.data.orderId} />,
        {
            preloadedState: {
                wallet: {
                    trading: {
                        ...getInitializedTradingState(),
                        trades: [trade],
                    },
                },
            },
        },
    );

describe('TradeDetailAlert', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each(alertLabelsCases)(
        'should render translated labels for $alertType alert',
        ({ alertType, titleKey, descriptionKey }) => {
            const { getByText } = renderAlert({ alertType });

            expect(getByText(getTranslation(titleKey))).toBeOnTheScreen();
            expect(getByText(getTranslation(descriptionKey))).toBeOnTheScreen();
        },
    );

    it('should render proceed payment button for waiting alert', () => {
        const { getByText } = renderAlert({ alertType: 'waiting' });

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.waitingAlert.button')),
        ).toBeOnTheScreen();
    });
});
