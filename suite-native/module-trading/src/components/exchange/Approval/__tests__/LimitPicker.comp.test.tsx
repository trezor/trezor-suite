import { renderWithStoreProviderAsync, userEvent, within } from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { LimitPicker, LimitPickerProps } from '../LimitPicker';

describe('LimitPicker', () => {
    const renderLimitPicker = (props: Partial<LimitPickerProps> = {}) => {
        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        return renderWithStoreProviderAsync(<LimitPicker quote={exchangeQuotes[0]} {...props} />, {
            preloadedState,
        });
    };

    it('should render Unlimited', async () => {
        const { getByTestId } = await renderLimitPicker({});

        const picker = getByTestId('ExchangeApproval/LimitPicker');

        expect(within(picker).getByText('Unlimited')).toBeOnTheScreen();
        expect(
            within(picker).getByText(/^Approve unlimited USDC to skip future approval requests/),
        ).toBeOnTheScreen();
    });

    it('should render selected value', async () => {
        const { getByTestId } = await renderLimitPicker({});

        const picker = getByTestId('ExchangeApproval/LimitPicker');
        const sheet = getByTestId('ExchangeApproval/LimitSheet');

        await userEvent.press(within(sheet).getByText('100 USDC'));

        expect(within(picker).getByText('100 USDC')).toBeOnTheScreen();
        expect(
            within(picker).getByText(/^Approve only the amount needed for this swap/),
        ).toBeOnTheScreen();
    });
});
