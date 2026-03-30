import type { CryptoId } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, userEvent } from '@suite-native/test-utils';
import { getWalletState } from '@suite-native/trading-fixtures';

import { LimitInfoRow } from '../LimitInfoRow';

type LimitInfoRowProps = React.ComponentProps<typeof LimitInfoRow>;

describe('LimitInfoRow', () => {
    const defaultProps: LimitInfoRowProps = {
        cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
        amount: '100',
        approvalType: 'MINIMAL',
        onPress: jest.fn(),
    };

    const renderLimitInfoRow = (props: Partial<LimitInfoRowProps> = {}) => {
        const preloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };

        return renderWithStoreProvider(<LimitInfoRow {...defaultProps} {...props} />, {
            preloadedState,
        });
    };

    it('should render limit label', () => {
        const { getByText } = renderLimitInfoRow();

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeApprovalScreen.limitLabel')),
        ).toBeOnTheScreen();
    });

    it('should render formatted amount when approval type is MINIMAL', () => {
        const { getByText } = renderLimitInfoRow({ approvalType: 'MINIMAL' });

        expect(getByText('100 USDC')).toBeOnTheScreen();
    });

    it('should render unlimited label when approval type is INFINITE', () => {
        const { getByText } = renderLimitInfoRow({ approvalType: 'INFINITE' });

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
});
