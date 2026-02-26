import { AccountKey, GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { userEvent } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getWalletState, sellQuotes } from '@suite-native/trading-fixtures';

import {
    SellPreviewContinueButton,
    SellPreviewContinueButtonProps,
} from '../SellPreviewContinueButton';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('SellPreviewContinueButton', () => {
    const renderSellPreviewContinueButton = (
        props: Partial<SellPreviewContinueButtonProps> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <SellPreviewContinueButton
                isDisabled={false}
                quote={sellQuotes[0]}
                onSignTransactionNavigation={jest.fn()}
                {...props}
            />,
            { preloadedState },
        );

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    const getPreloadedState = (): PreloadedState => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };
        preloadedState.wallet!.trading!.sell!.tradingAccountKey = 'eth-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`
        preloadedState.wallet!.send!.precomposedTx = {
            type: 'final',
            totalSpent: '1100',
            fee: '1000',
            feePerByte: '100',
            bytes: 1,
        } as GeneralPrecomposedTransactionFinal;

        return preloadedState;
    };

    it('should render nothing when precomposed transaction is not in final state', async () => {
        const preloadedState = getPreloadedState();
        preloadedState!.wallet!.send!.precomposedTx = {
            type: 'composing',
        } as any;
        const { toJSON } = await renderSellPreviewContinueButton({}, preloadedState);

        expect(toJSON()).toBeNull();
    });

    it('should render continue button', async () => {
        const { getByText } = await renderSellPreviewContinueButton({}, getPreloadedState());

        expect(getByText('Continue')).toBeOnTheScreen();
    });

    it('should render disabled button when isDisabled prop is specified', async () => {
        const { getByText } = await renderSellPreviewContinueButton(
            { isDisabled: true },
            getPreloadedState(),
        );

        expect(getByText('Continue')).toBeDisabled();
    });

    it('should fire console.warn and do not navigate when quote is not specified', async () => {
        const mockOnSignTransactionNavigation = jest.fn();
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { getByText } = await renderSellPreviewContinueButton(
            { quote: undefined, onSignTransactionNavigation: mockOnSignTransactionNavigation },
            getPreloadedState(),
        );

        await userEvent.press(getByText('Continue'));

        expect(consoleWarnSpy).toHaveBeenCalledWith('quote or fromAccount is not defined', {
            hasQuote: false,
            hasFromAccount: true,
        });
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockOnSignTransactionNavigation).not.toHaveBeenCalled();
    });

    it('should fire console.warn and do not navigate when fromAccount is not found', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const preloadedState = getPreloadedState();
        preloadedState!.wallet!.trading!.sell!.tradingAccountKey = 'non-existing-key';
        const mockOnSignTransactionNavigation = jest.fn();
        const { getByText } = await renderSellPreviewContinueButton(
            { onSignTransactionNavigation: mockOnSignTransactionNavigation },
            preloadedState,
        );

        await userEvent.press(getByText('Continue'));

        expect(consoleWarnSpy).toHaveBeenCalledWith('quote or fromAccount is not defined', {
            hasQuote: true,
            hasFromAccount: false,
        });
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockOnSignTransactionNavigation).not.toHaveBeenCalled();
    });

    it('should navigate to TradingOutputsReview on continue press', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const mockOnSignTransactionNavigation = jest.fn();
        const { getByText } = await renderSellPreviewContinueButton(
            { onSignTransactionNavigation: mockOnSignTransactionNavigation },
            getPreloadedState(),
        );

        await userEvent.press(getByText('Continue'));

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith({
            name: 'TradingSellOutputsReview',
            params: {
                accountKey: 'eth-account-1',
                orderId: sellQuotes[0].orderId,
                tokenContract: undefined,
            },
        });
        expect(mockOnSignTransactionNavigation).toHaveBeenCalledTimes(1);
    });
});
