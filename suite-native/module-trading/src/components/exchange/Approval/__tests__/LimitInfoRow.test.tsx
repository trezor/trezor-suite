import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, userEvent } from '@suite-native/test-utils';
import { getWalletState, mercuryoFixedBestQuote } from '@suite-native/trading-fixtures';

import { LimitInfoRow } from '../LimitInfoRow';

type LimitInfoRowProps = React.ComponentProps<typeof LimitInfoRow>;

describe('LimitInfoRow', () => {
    const defaultProps: LimitInfoRowProps = {
        onPress: jest.fn(),
    };

    const renderLimitInfoRow = (props: Partial<LimitInfoRowProps> = {}, quoteOverrides = {}) => {
        const walletState = getWalletState({ tradeType: 'exchange' });
        const preloadedState = {
            wallet: {
                ...walletState,
                trading: {
                    ...walletState.trading,
                    exchange: {
                        ...walletState.trading.exchange,
                        selectedQuote: {
                            ...mercuryoFixedBestQuote,
                            ...quoteOverrides,
                        },
                    },
                },
            },
        };

        return renderWithStoreProvider(<LimitInfoRow {...defaultProps} {...props} />, {
            preloadedState,
        });
    };

    it('should render formatted amount when approval type is MINIMAL', () => {
        const { getByText } = renderLimitInfoRow(
            {},
            { approvalType: 'MINIMAL', sendStringAmount: '100' },
        );

        expect(getByText('100 USDC')).toBeOnTheScreen();
    });

    it('should render unlimited label when approval type is INFINITE', () => {
        const { getByText } = renderLimitInfoRow({}, { approvalType: 'INFINITE' });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel')),
        ).toBeOnTheScreen();
    });

    it('should render children', () => {
        const { getByText } = renderLimitInfoRow({
            children: <Text>Child content</Text>,
        });

        expect(getByText('Child content')).toBeOnTheScreen();
    });

    it('should call onPress when pressed', async () => {
        const onPress = jest.fn();
        const { getByTestId } = renderLimitInfoRow({
            onPress,
            testID: 'test-limit-info-row',
        });

        await userEvent.press(getByTestId('test-limit-info-row'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should render "Limit" label when quote has not preapproved limit', () => {
        const { getByText } = renderLimitInfoRow();

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeApprovalScreen.limitLabel')),
        ).toBeOnTheScreen();
    });

    it('should render "New limit" label when quote has preapproved limit', () => {
        const { getByText } = renderLimitInfoRow({}, { preapprovedStringAmount: '25' });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeApprovalScreen.newLimitLabel')),
        ).toBeOnTheScreen();
    });
});
