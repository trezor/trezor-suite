import type { CryptoId } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, userEvent } from '@suite-native/test-utils-store';
import { getWalletState, mercuryoFixedBestQuote } from '@suite-native/trading-fixtures';

import { LimitInfoRow } from './LimitInfoRow';

type LimitInfoRowProps = React.ComponentProps<typeof LimitInfoRow>;

describe('LimitInfoRow', () => {
    const cryptoIdWithoutCoinInfo = 'ethereum--0xWithoutObjectInCoinsInfo' as CryptoId;

    const defaultProps: LimitInfoRowProps = {
        onPress: jest.fn(),
    };

    const renderLimitInfoRow = async (
        props: Partial<LimitInfoRowProps> = {},
        quoteOverrides = {},
    ) => {
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

        return await renderWithStoreProvider(<LimitInfoRow {...defaultProps} {...props} />, {
            preloadedState,
        });
    };

    it('should render formatted amount when approval type is MINIMAL', async () => {
        const { getByText } = await renderLimitInfoRow(
            {},
            { approvalType: 'MINIMAL', sendStringAmount: '100' },
        );

        expect(getByText('100 USDC')).toBeOnTheScreen();
    });

    it('should render unlimited label when approval type is INFINITE', async () => {
        const unlimitedText = getTranslation(
            'moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel',
        );

        const { getByText } = await renderLimitInfoRow({}, { approvalType: 'INFINITE' });

        expect(getByText(unlimitedText)).toBeOnTheScreen();
    });

    it('should render unlimited label without coin symbol when approval type is INFINITE and coin is missing in trading info', async () => {
        const unlimitedText = getTranslation(
            'moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel',
        );

        const { getByText, queryByText } = await renderLimitInfoRow(
            {},
            { approvalType: 'INFINITE', send: cryptoIdWithoutCoinInfo },
        );

        expect(queryByText('USDC')).toBeNull();
        expect(getByText(new RegExp(`^${unlimitedText}\\s*$`))).toBeOnTheScreen();
    });

    it('should render children', async () => {
        const { getByText } = await renderLimitInfoRow({
            children: <Text>Child content</Text>,
        });

        expect(getByText('Child content')).toBeOnTheScreen();
    });

    it('should call onPress when pressed', async () => {
        const onPress = jest.fn();
        const { getByTestId } = await renderLimitInfoRow({
            onPress,
            testID: 'test-limit-info-row',
        });

        await userEvent.press(getByTestId('test-limit-info-row'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should render "Limit" label when quote has not preapproved limit', async () => {
        const { getByText } = await renderLimitInfoRow();

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeApprovalScreen.limitLabel')),
        ).toBeOnTheScreen();
    });

    it('should render "New limit" label when quote has preapproved limit', async () => {
        const { getByText } = await renderLimitInfoRow({}, { preapprovedStringAmount: '25' });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeApprovalScreen.newLimitLabel')),
        ).toBeOnTheScreen();
    });
});
