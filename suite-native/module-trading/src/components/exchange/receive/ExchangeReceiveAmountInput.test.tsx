import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, fireEvent } from '@suite-native/test-utils-store';
import { btcAsset, mercuryoFixedWorstQuote, usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { ExchangeReceiveAmountInput } from './ExchangeReceiveAmountInput';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const mockShowAlert = jest.fn();
jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
        hideAlert: jest.fn(),
    }),
}));

describe('ExchangeReceiveAmountInput', () => {
    let form: ExchangeFormType;

    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
    };

    const renderExchangeReceiveAmountInput = async (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(<ExchangeReceiveAmountInput />, {
            tradeType: 'exchange',
            overrides: { ...baseOverrides, ...extraOverrides },
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        mockShowAlert.mockClear();
        const { result } = await renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
            overrides: baseOverrides,
        });
        form = result.current;
    });

    it('should render receiveCryptoAmount form value', async () => {
        await act(() => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', usdcAsset);
            form.setValue('quote', {
                ...mercuryoFixedWorstQuote,
                send: btcAsset.cryptoId,
                receive: usdcAsset.cryptoId,
            });
        });

        const { getByLabelText } = await renderExchangeReceiveAmountInput();

        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
        ).toHaveDisplayValue('0.00083554');
    });

    it('should show not available alert on press', async () => {
        const { getByLabelText } = await renderExchangeReceiveAmountInput();

        await fireEvent.press(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
        );

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
        expect(mockShowAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                title: getTranslation('moduleTrading.selectCoin.amountNotAvailableAlert.title'),
                description: getTranslation(
                    'moduleTrading.selectCoin.amountNotAvailableAlert.description',
                ),
                pictogramVariant: 'info',
                primaryButtonTitle: getTranslation('generic.buttons.gotIt'),
            }),
        );
    });

    it('should display loading skeleton when quotes are being fetched', async () => {
        const { getByLabelText } = await renderExchangeReceiveAmountInput({
            wallet: { trading: { exchange: { isLoading: true } } },
        });

        expect(
            getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
        ).toBeTruthy();
    });
});
