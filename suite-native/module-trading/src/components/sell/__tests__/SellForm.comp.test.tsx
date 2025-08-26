import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../__fixtures__/account';
import { sellQuotes } from '../../../__fixtures__/sellQuotes';
import { btcAsset } from '../../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import { SellFormType } from '../../../types/sell';
import { SellForm } from '../SellForm';

jest.mock('../../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../../hooks/general/useFocusedValueWatch'),
);

describe('SellForm', () => {
    const renderFormHook = (preloadedState: PreloadedState) =>
        renderHookWithStoreProviderAsync(() => useSellForm(), { preloadedState });

    const renderSellForm = (preloadedState: PreloadedState, form: SellFormType) =>
        renderWithStoreProviderAsync(<SellForm />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    it('should render when sell data are not preloaded', async () => {
        const { result } = await renderFormHook({});
        const { getByText, getByLabelText } = await renderSellForm({}, result.current);

        expect(getByText('You pay')).toBeOnTheScreen();
        expect(getByText('You get')).toBeOnTheScreen();
        expect(getByLabelText('Select coin')).toHaveTextContent(/Select coin/);
    });

    describe('with preloaded sell data', () => {
        let form: SellFormType;
        let preloadedState: PreloadedState;

        beforeEach(async () => {
            preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };
            preloadedState.wallet!.tradingNew!.sell!.quotes = sellQuotes;

            const { result } = await renderFormHook(preloadedState);
            form = result.current;
            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('sendAccount', getBtcAccount());
                form.setValue('amountInCrypto', true);
                form.setValue('cryptoStringAmount', '0.001');
                form.setValue('quote', sellQuotes[1]);
            });
        });

        it('should render with default values', async () => {
            const { getByLabelText, getByText } = await renderSellForm(preloadedState, form);

            expect(getByText('You pay')).toBeOnTheScreen();
            expect(getByLabelText('Select fiat currency')).toBeOnTheScreen();
            expect(getByLabelText('Select coin')).toHaveTextContent(/BTC/);
            expect(getByText('Country of residence')).toBeOnTheScreen();
            expect(getByText('Provider')).toBeOnTheScreen();
        });

        it('should render only SellCard and Done when amount input is active', async () => {
            act(() => {
                form.setValue('focusedValue', 'fiatStringAmount');
            });
            const { queryByText, getByText } = await renderSellForm(preloadedState, form);

            expect(getByText('You pay')).toBeOnTheScreen();
            expect(getByText('You get')).toBeOnTheScreen();

            expect(queryByText('Continue')).toBeNull();
            expect(queryByText('Country of residence')).toBeNull();
            expect(queryByText('Provider')).toBeNull();
        });
    });
});
