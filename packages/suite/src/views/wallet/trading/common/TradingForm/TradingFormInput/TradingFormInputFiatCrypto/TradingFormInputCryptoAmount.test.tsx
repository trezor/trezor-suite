import '@suite-common/test-utils/globalOverrides';

import { useForm } from 'react-hook-form';

import { screen, waitFor } from '@testing-library/react';
import { type BuyTrade, type CryptoId } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TradingAssetOption, type TradingBuyFormProps } from '@suite-common/trading';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { PROTO } from '@trezor/connect';

import { BTC_ACCOUNT } from 'src/actions/wallet/trading/__fixtures__/tradingCommonActions/accounts';
import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';

import { TradingFormInputCryptoAmount } from './TradingFormInputCryptoAmount';
import { mockInitialAppState } from '../../../../../../../../mocks/mockInitialAppState';

const mockUseTradingFormContext = jest.fn();

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
        receiveAmount: '0.03615612',
        receiveCurrency: undefined,
    }),
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectTradingSendAccount: () => BTC_ACCOUNT,
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

const TradingFormTestHarness = ({ asset }: { asset: TradingAssetOption }) => {
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
        <TradingFormInputCryptoAmount
            cryptoInputName="cryptoInput"
            fiatInputName="fiatInput"
            cryptoSelectName="cryptoSelect"
            isInSats={asset.networkSymbol === 'btc'}
        />
    );
};

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
});
