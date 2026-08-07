import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    within,
} from '@suite-native/test-utils-store';
import { btcAsset, ethOnBaseAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { ExchangeCard } from './ExchangeCard';
import { useExchangeForm } from '../../hooks/exchange/useExchangeForm';
import { createTradingPreloadedState } from '../../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
    useRoute: () => ({ params: {} }),
}));

describe('ExchangeCard', () => {
    let form: ExchangeFormType;

    const preloadedState = createTradingPreloadedState({
        tradeType: 'exchange',
        overrides: {
            wallet: {
                trading: {
                    exchange: {
                        exchangeInfo: {
                            buyCryptoIds: [],
                        },
                    },
                },
            },
        },
    });

    const renderForm = () =>
        renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState,
        });

    const renderExchangeCard = () =>
        renderWithStoreProvider(<ExchangeCard isAmountInputActive={false} />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        const { result } = renderForm();
        form = result.current;
    });

    it('should render send and receive sections with selected assets', () => {
        act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('sendCryptoAmount', '100');
            form.setValue('receiveAsset', ethOnBaseAsset);
        });

        const { getByTestId } = renderExchangeCard();
        const sendSection = getByTestId('@trading/exchangeCard/sendSection');
        const receiveSection = getByTestId('@trading/exchangeCard/receiveSection');

        expect(
            within(sendSection).getByText(getTranslation('moduleTrading.selectCoinToSell.title')),
        ).toBeOnTheScreen();
        expect(
            within(sendSection).getByLabelText(
                getTranslation('moduleTrading.selectCoin.buttonTitle'),
            ),
        ).toHaveTextContent(/USDC/);
        expect(
            within(sendSection).getByLabelText(getTranslation('moduleTrading.networkName')),
        ).toHaveTextContent('Ethereum');
        expect(
            within(sendSection).getByLabelText(
                getTranslation('moduleTrading.selectCoinToSell.amountLabel'),
            ),
        ).toHaveDisplayValue('100');

        expect(
            within(receiveSection).getByText(getTranslation('moduleTrading.selectCoin.title')),
        ).toBeOnTheScreen();
        expect(
            within(receiveSection).getByLabelText(
                getTranslation('moduleTrading.selectCoin.buttonTitle'),
            ),
        ).toHaveTextContent(/ETH/);
        expect(
            within(receiveSection).getByLabelText(getTranslation('moduleTrading.networkName')),
        ).toHaveTextContent('Base');
        expect(
            within(receiveSection).getByLabelText(
                getTranslation('moduleTrading.selectCoin.amountLabel'),
            ),
        ).toBeDisabled();
        expect(
            within(receiveSection).getByText(getTranslation('moduleTrading.tradingScreen.balance')),
        ).toBeOnTheScreen();
    });

    it('should convert receiveCryptoAmount to the base unit before passing it to CryptoToFiatValueBadge when bitcoin amount unit is sats', () => {
        const satsPreloadedState = createTradingPreloadedState({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI },
                    trading: {
                        exchange: {
                            exchangeInfo: {
                                buyCryptoIds: [],
                            },
                        },
                    },
                },
            },
        });

        act(() => {
            form.setValue('receiveAsset', btcAsset);
        });
        act(() => {
            form.setValue('receiveCryptoAmount', '1234567123456');
        });

        const { getByText, queryByText } = renderWithStoreProvider(
            <ExchangeCard isAmountInputActive={false} />,
            {
                preloadedState: satsPreloadedState,
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            },
        );

        expect(getByText('12345.67123456-bitcoin')).toBeOnTheScreen();
        expect(queryByText('1234567123456-bitcoin')).toBeNull();
    });
});
