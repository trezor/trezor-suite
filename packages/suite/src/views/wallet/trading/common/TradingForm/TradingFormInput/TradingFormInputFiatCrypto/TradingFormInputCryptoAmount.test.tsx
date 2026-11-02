import '@suite-common/test-utils/globalOverrides';

import { useForm } from 'react-hook-form';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type BuyTrade, type CryptoId } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingAssetOption,
    type TradingAssetSellOption,
    type TradingBuyFormProps,
    type TradingExchangeFormProps,
} from '@suite-common/trading';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { PROTO } from '@trezor/connect';

import { BTC_ACCOUNT } from 'src/actions/wallet/trading/__fixtures__/tradingCommonActions/accounts';
import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';

import { TradingFormInputCryptoAmount } from './TradingFormInputCryptoAmount';
import { mockInitialAppState } from '../../../../../../../../mocks/mockInitialAppState';

const mockUseTradingFormContext = jest.fn();
let mockQuoteCryptoAmount = '0.03615612';

jest.mock('src/hooks/wallet/trading/form/useTradingCommonForm', () => ({
    useTradingFormContext: () => mockUseTradingFormContext(),
}));

jest.mock('src/views/wallet/trading/common/hooks/useTradingSelectedQuote', () => ({
    useTradingSelectedQuote: (): Partial<BuyTrade> => ({ receiveStringAmount: '0.03615612' }),
}));

jest.mock('src/views/wallet/trading/common/hooks/useTradingQuoteAmounts', () => ({
    useTradingQuoteAmounts: (): TradingGetCryptoQuoteAmountProps => ({
        amountInCrypto: false,
        sendAmount: '100',
        sendCurrency: 'USD',
        receiveAmount: mockQuoteCryptoAmount,
        receiveCurrency: undefined,
    }),
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectTradingSendAccount: () => BTC_ACCOUNT,
}));

const BTC_SYMBOL = asNetworkSymbol('btc');
const ETH_SYMBOL = asNetworkSymbol('eth');
const XRP_SYMBOL = asNetworkSymbol('xrp');

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

const ETHEREUM_ASSET: TradingAssetOption = {
    id: 'ethereum' as CryptoId,
    isNativeToken: true,
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    contractAddress: null,
    symbol: ETH_SYMBOL,
    displaySymbol: 'ETH',
    networkName: 'Ethereum',
    networkSymbol: ETH_SYMBOL,
};

const BITCOIN_SELL_ASSET: TradingAssetSellOption = {
    ...BITCOIN_ASSET,
    accountKey: BTC_ACCOUNT.key,
};

const XRP_ASSET: TradingAssetOption = {
    id: 'ripple' as CryptoId,
    isNativeToken: true,
    name: 'XRP',
    coingeckoId: 'ripple',
    contractAddress: null,
    symbol: XRP_SYMBOL,
    displaySymbol: 'XRP',
    networkName: 'XRP',
    networkSymbol: XRP_SYMBOL,
};

type TradingFormTestHarnessProps = { asset: TradingAssetOption };

const TradingFormTestHarness = ({ asset }: TradingFormTestHarnessProps) => {
    const methods = useForm<TradingBuyFormProps>({
        defaultValues: {
            fiatInput: '100',
            cryptoInput: '',
            currencySelect: { value: 'usd', label: 'USD' },
            cryptoSelect: asset,
            amountInCrypto: false,
        },
    });

    mockUseTradingFormContext.mockReturnValue({
        ...methods,
        type: 'buy',
        network: getNetwork(asset.networkSymbol),
        form: {
            state: {
                isFormLoading: false,
            },
        },
    });

    return (
        <>
            <TradingFormInputCryptoAmount
                cryptoInputName="cryptoInput"
                fiatInputName="fiatInput"
                cryptoSelectName="cryptoSelect"
                isInSats={asset.networkSymbol === 'btc'}
            />
            <output data-testid="form-validity">
                {methods.formState.isValid ? 'valid' : 'invalid'}
            </output>
        </>
    );
};

const ExchangeTestHarness = () => {
    const methods = useForm<TradingExchangeFormProps>({
        mode: 'onChange',
        defaultValues: {
            outputs: [{ amount: '', fiat: '', token: null }],
            sendCryptoSelect: BITCOIN_SELL_ASSET,
            amountInCrypto: true,
        },
    });

    mockUseTradingFormContext.mockReturnValue({
        ...methods,
        type: 'exchange',
        form: {
            state: { isFormLoading: false },
            helpers: { setFractionButton: jest.fn() },
        },
        setShowReserveBanner: jest.fn(),
    });

    return (
        <>
            <TradingFormInputCryptoAmount
                cryptoInputName={TRADING_FORM_OUTPUT_AMOUNT}
                fiatInputName={TRADING_FORM_OUTPUT_FIAT}
                cryptoSelectName={TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT}
            />
            <output data-testid="@trading/form/amount-error">
                {methods.formState.errors.outputs?.[0]?.amount?.type ?? ''}
            </output>
            <button
                type="button"
                data-testid="@trading/form/reset-send-asset"
                onClick={() =>
                    methods.setValue(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT, undefined)
                }
            />
        </>
    );
};

const createServices = () =>
    createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    }).services;

const renderCryptoAmount = (asset: TradingAssetOption) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                settings: {
                    ...mockInitialAppState.wallet.settings,
                    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
                },
            },
        },
    });

    renderWithProviders(services, <TradingFormTestHarness asset={asset} />);
};

describe('TradingFormInputCryptoAmount', () => {
    beforeEach(() => {
        mockQuoteCryptoAmount = '0.03615612';
    });

    it.each([
        ['365.32229800', '365.322298'],
        ['365.32229899', '365.322298'],
    ])('fills a valid XRP amount from quote %s as %s', async (quoteAmount, expectedAmount) => {
        mockQuoteCryptoAmount = quoteAmount;
        renderCryptoAmount(XRP_ASSET);

        await waitFor(() => {
            expect(screen.getByTestId('@trading/form/crypto-input')).toHaveValue(expectedAmount);
            expect(screen.getByTestId('form-validity')).toHaveTextContent(/^valid$/);
        });
    });

    it('truncates fractional sats when filling the bought BTC amount', async () => {
        mockQuoteCryptoAmount = '0.0361561299';
        renderCryptoAmount(BITCOIN_ASSET);

        await waitFor(() => {
            expect(screen.getByTestId('@trading/form/crypto-input')).toHaveValue('3,615,612');
            expect(screen.getByTestId('form-validity')).toHaveTextContent(/^valid$/);
        });
    });

    it('fills the bought amount from the quote in sats when buying BTC with sats displayed', async () => {
        renderCryptoAmount(BITCOIN_ASSET);

        await waitFor(() =>
            expect(screen.getByTestId('@trading/form/crypto-input')).toHaveValue('3,615,612'),
        );
    });

    it('fills the bought amount from the quote in units when buying ETH from a BTC account with sats displayed', async () => {
        renderCryptoAmount(ETHEREUM_ASSET);

        await waitFor(() =>
            expect(screen.getByTestId('@trading/form/crypto-input')).toHaveValue('0.03615612'),
        );
    });

    it('validates the swap amount against the balance when the send asset is selected', async () => {
        const user = userEvent.setup();

        renderWithProviders(createServices(), <ExchangeTestHarness />);

        await user.type(screen.getByTestId('@trading/form/crypto-input'), '10');

        await waitFor(() =>
            expect(screen.getByTestId('@trading/form/amount-error')).toHaveTextContent(
                'reserveOrBalance',
            ),
        );
    });

    it('skips the swap amount validation after the send asset is reset', async () => {
        const user = userEvent.setup();

        renderWithProviders(createServices(), <ExchangeTestHarness />);

        await user.click(screen.getByTestId('@trading/form/reset-send-asset'));
        await user.type(screen.getByTestId('@trading/form/crypto-input'), '10.123456789');

        await waitFor(() =>
            expect(screen.getByTestId('@trading/form/crypto-input')).toHaveValue('10.123456789'),
        );
        expect(screen.getByTestId('@trading/form/amount-error')).toBeEmptyDOMElement();
    });
});
