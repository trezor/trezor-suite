import '@suite-common/test-utils/globalOverrides';

import { useEffect } from 'react';
import { type FieldPath, useForm, useWatch } from 'react-hook-form';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type CryptoId } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TradingAssetOption, type TradingBuyFormProps } from '@suite-common/trading';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Rate, asTimestamp } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { intermediaryTheme } from '@trezor/components';
import { PROTO } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingFormInputBaseCurrencyAmount } from './TradingFormInputBaseCurrencyAmount';
import { mockInitialAppState } from '../../../../../../../../mocks/mockInitialAppState';

const mockUseTradingFormContext = jest.fn();

jest.mock('src/hooks/wallet/trading/form/useTradingCommonForm', () => ({
    useTradingFormContext: () => mockUseTradingFormContext(),
}));

const BTC_SYMBOL = asNetworkSymbol('btc');
const ETH_SYMBOL = asNetworkSymbol('eth');

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

const ETH_BTC_RATE: Rate = {
    ...BTC_USD_RATE,
    rate: 0.05,
    ticker: { symbol: ETH_SYMBOL },
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
    symbol?: NetworkSymbol;
    cryptoInput?: string;
};

const TradingFormTestHarness = ({
    invalidField,
    symbol = BTC_SYMBOL,
    cryptoInput: initialCryptoInput = '',
}: TradingFormTestHarnessProps) => {
    const methods = useForm<TradingBuyFormProps>({
        defaultValues: { ...DEFAULT_VALUES, cryptoInput: initialCryptoInput },
    });
    const [cryptoInput, fiatInput, amountInCrypto, amountInputSource] = useWatch({
        control: methods.control,
        name: ['cryptoInput', 'fiatInput', 'amountInCrypto', 'amountInputSource'],
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
                symbol={symbol}
            />
            <output data-testid="@trading/form/values">
                {JSON.stringify({ cryptoInput, fiatInput, amountInCrypto, amountInputSource })}
            </output>
        </>
    );
};

type RenderBaseCurrencyAmountParams = TradingFormTestHarnessProps & {
    localCurrency?: BaseCurrencyCode;
    bitcoinAmountUnit?: PROTO.AmountUnit;
    btcUsdRate?: number;
};

const renderBaseCurrencyAmount = ({
    localCurrency = 'usd',
    bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN,
    btcUsdRate = BTC_USD_RATE.rate,
    ...harnessProps
}: RenderBaseCurrencyAmountParams = {}) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                settings: {
                    ...mockInitialAppState.wallet.settings,
                    localCurrency,
                    bitcoinAmountUnit,
                },
                fiat: {
                    ...mockInitialAppState.wallet.fiat,
                    current: {
                        ...mockInitialAppState.wallet.fiat.current,
                        'btc-usd': { ...BTC_USD_RATE, rate: btcUsdRate },
                        'eth-btc': ETH_BTC_RATE,
                    },
                },
            },
        },
    });

    renderWithProviders(services, <TradingFormTestHarness {...harnessProps} />);
};

describe('TradingFormInputBaseCurrencyAmount', () => {
    it('writes the converted crypto amount, switches the active input to crypto and marks the base currency as the input source', async () => {
        const user = userEvent.setup();

        renderBaseCurrencyAmount();

        await user.type(screen.getByTestId('@trading/form/base-currency-input'), '100');

        expect(screen.getByTestId('@trading/form/values')).toHaveTextContent(
            JSON.stringify({
                cryptoInput: '4',
                fiatInput: '',
                amountInCrypto: true,
                amountInputSource: 'base-currency',
            }),
        );
    });

    it('rounds the converted crypto amount down to the asset decimals', async () => {
        const user = userEvent.setup();

        renderBaseCurrencyAmount({ btcUsdRate: 3 });

        await user.type(screen.getByTestId('@trading/form/base-currency-input'), '200');

        expect(screen.getByTestId('@trading/form/values')).toHaveTextContent(
            '"cryptoInput":"66.66666666"',
        );
    });

    it('shows the base currency amount of the crypto amount without trailing zeros', () => {
        renderBaseCurrencyAmount({ cryptoInput: '4' });

        expect(screen.getByTestId('@trading/form/base-currency-input')).toHaveValue('100');
    });

    it('converts the base currency amount from satoshis when BTC is the base currency and sats are displayed', async () => {
        const user = userEvent.setup();

        renderBaseCurrencyAmount({
            symbol: ETH_SYMBOL,
            localCurrency: 'btc',
            bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
        });

        expect(screen.getByTestId('@trading/form/base-currency-label')).toHaveTextContent('sat');

        await user.type(screen.getByTestId('@trading/form/base-currency-input'), '250000');

        expect(screen.getByTestId('@trading/form/values')).toHaveTextContent(
            JSON.stringify({
                cryptoInput: '0.05',
                fiatInput: '',
                amountInCrypto: true,
                amountInputSource: 'base-currency',
            }),
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
