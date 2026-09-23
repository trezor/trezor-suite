import '@suite-common/test-utils/globalOverrides';

import { useEffect } from 'react';
import { type FieldPath, useForm, useWatch } from 'react-hook-form';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type CryptoId } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TradingAssetOption, type TradingBuyFormProps } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Rate, asTimestamp } from '@suite-common/wallet-types';
import { intermediaryTheme } from '@trezor/components';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingFormInputBaseCurrencyAmount } from './TradingFormInputBaseCurrencyAmount';
import { mockInitialAppState } from '../../../../../../../../mocks/mockInitialAppState';

const mockUseTradingFormContext = jest.fn();

jest.mock('src/hooks/wallet/trading/form/useTradingCommonForm', () => ({
    useTradingFormContext: () => mockUseTradingFormContext(),
}));

const BTC_SYMBOL = asNetworkSymbol('btc');

const BITCOIN_ASSET: TradingAssetOption = {
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: BTC_SYMBOL,
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: BTC_SYMBOL,
};

const BTC_USD_RATE: Rate = {
    rate: 25,
    lastTickerTimestamp: asTimestamp(0),
    lastSuccessfulFetchTimestamp: asTimestamp(0),
    isLoading: false,
    error: null,
    ticker: { symbol: BTC_SYMBOL },
};

const DEFAULT_VALUES: TradingBuyFormProps = {
    fiatInput: '75',
    cryptoInput: '',
    currencySelect: { value: 'usd', label: 'USD' },
    cryptoSelect: BITCOIN_ASSET,
    countrySelect: {
        value: 'US',
        label: 'United States',
        shortLabel: 'USA',
        codeAlpha3: 'USA',
        flag: 'US',
        name: 'United States',
    },
    countrySubdivisionSelect: undefined,
    paymentMethod: undefined,
    provider: undefined,
    amountInCrypto: false,
    receiveAddress: undefined,
};

type TradingFormTestHarnessProps = {
    invalidField?: FieldPath<TradingBuyFormProps>;
};

const TradingFormTestHarness = ({ invalidField }: TradingFormTestHarnessProps) => {
    const methods = useForm<TradingBuyFormProps>({ defaultValues: DEFAULT_VALUES });
    const [cryptoInput, fiatInput, amountInCrypto] = useWatch({
        control: methods.control,
        name: ['cryptoInput', 'fiatInput', 'amountInCrypto'],
    });

    const { setError } = methods;
    useEffect(() => {
        if (invalidField) {
            setError(invalidField, { type: 'validate', message: 'invalid' });
        }
    }, [invalidField, setError]);

    mockUseTradingFormContext.mockReturnValue({
        ...methods,
        type: 'buy',
        form: {
            state: {
                isFormLoading: false,
            },
        },
    });

    return (
        <>
            <TradingFormInputBaseCurrencyAmount
                cryptoInputName="cryptoInput"
                fiatInputName="fiatInput"
                symbol={BTC_SYMBOL}
            />
            <output data-testid="@trading/form/values">
                {JSON.stringify({ cryptoInput, fiatInput, amountInCrypto })}
            </output>
        </>
    );
};

const renderBaseCurrencyAmount = (harnessProps: TradingFormTestHarnessProps = {}) => {
    const root = createTestCompositionRoot({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                settings: {
                    ...mockInitialAppState.wallet.settings,
                    localCurrency: 'usd',
                },
                fiat: {
                    ...mockInitialAppState.wallet.fiat,
                    current: {
                        ...mockInitialAppState.wallet.fiat.current,
                        'btc-usd': BTC_USD_RATE,
                    },
                },
            },
        },
    });

    renderWithProviders(root, <TradingFormTestHarness {...harnessProps} />);
};

describe('TradingFormInputBaseCurrencyAmount', () => {
    it('writes the converted crypto amount and switches the active input to crypto', async () => {
        const user = userEvent.setup();

        renderBaseCurrencyAmount();

        await user.type(screen.getByTestId('@trading/form/base-currency-input'), '100');

        expect(screen.getByTestId('@trading/form/values')).toHaveTextContent(
            JSON.stringify({ cryptoInput: '4', fiatInput: '', amountInCrypto: true }),
        );
    });

    it('keeps the neutral color when neither amount is invalid', () => {
        renderBaseCurrencyAmount();

        expect(screen.getByTestId('@trading/form/base-currency-input')).not.toHaveStyle({
            color: intermediaryTheme.light.contentCritical,
        });
    });

    it.each<FieldPath<TradingBuyFormProps>>(['cryptoInput', 'fiatInput'])(
        'turns critical when %s is invalid',
        async invalidField => {
            renderBaseCurrencyAmount({ invalidField });

            expect(await screen.findByTestId('@trading/form/base-currency-input')).toHaveStyle({
                color: intermediaryTheme.light.contentCritical,
            });
            expect(screen.getByTestId('@trading/form/base-currency-label')).toHaveStyle({
                color: intermediaryTheme.light.contentCritical,
            });
        },
    );
});
