import { useForm } from 'react-hook-form';

import { act } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    type TradingAssetOption,
    type TradingAssetSellOption,
    type TradingExchangeFormProps,
    tradingExchangeActions,
} from '@suite-common/trading';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useExchangeFormInputs } from '../useExchangeFormInputs';

jest.mock('src/hooks/wallet/useBitcoinAmountUnit', () => ({
    useBitcoinAmountUnit: () => ({ isBtcSatsAmountUnit: false }),
}));

jest.mock('src/hooks/wallet/trading/form/common/useTradingAssetDecimals', () => ({
    useTradingAssetDecimals: () => ({ getAssetDecimals: () => 8 }),
}));

jest.mock('src/hooks/wallet/trading/form/common/useTradingFiatValues', () => ({
    useTradingFiatValues: () => ({
        fiatRate: { rate: 50000 },
        fiatRatesUpdater: jest.fn(() => Promise.resolve({ rate: 50000 })),
    }),
}));

jest.mock('@suite-common/wallet-core', () => {
    const actual = jest.requireActual('@suite-common/wallet-core');

    return {
        ...actual,
        selectIsNetworkReserveEnabled: () => false,
        selectVisibleDeviceAccounts: () => [],
    };
});

const ACCOUNT = mockWalletAccount({ symbol: 'btc', formattedBalance: '2' });

const SEND_CRYPTO_SELECT: TradingAssetSellOption = {
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: 'btc',
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: 'btc',
    accountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: 'btc' }),
};

const RECEIVE_CRYPTO_SELECT: TradingAssetOption = {
    id: 'ethereum' as CryptoId,
    isNativeToken: true,
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    contractAddress: null,
    symbol: 'eth',
    displaySymbol: 'ETH',
    networkName: 'Ethereum',
    networkSymbol: 'eth',
};

const DEFAULTS: TradingExchangeFormProps = {
    outputs: [
        {
            type: 'payment',
            address: 'address',
            amount: '',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
            label: '',
        },
    ],
    sendCryptoSelect: SEND_CRYPTO_SELECT,
    receiveCryptoSelect: RECEIVE_CRYPTO_SELECT,
    amountInCrypto: true,
    rateType: 'floating',
    exchangeType: 'CEX',
    exchangeComparatorKycFilter: 'all',
    exchangeComparatorRateFilter: 'all',
    provider: undefined,
    feePerUnit: '',
    feeLimit: '',
    options: ['broadcast'],
    bitcoinLocktimeBlockHeight: '',
    bitcoinLocktimeDatetime: '',
    ethereumNonce: '',
    transactionData: '',
    destinationTag: '',
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    utxoSorting: 'newestFirst',
    selectedUtxos: [],
};

const mockComposeRequest = jest.fn();

const renderExchangeFormInputs = () => {
    const store = configureMockStore({
        preloadedState: {
            wallet: { accounts: [ACCOUNT] },
        },
    });

    const utils = renderHookWithStoreProvider(
        () => {
            const methods = useForm<TradingExchangeFormProps>({
                mode: 'onChange',
                defaultValues: DEFAULTS,
            });
            const inputs = useExchangeFormInputs({
                account: ACCOUNT,
                methods,
                setAmountLimits: jest.fn(),
                changeFeeLevel: jest.fn(),
                composeRequest: mockComposeRequest,
                setComposedLevels: jest.fn(),
                composedLevels: undefined,
                composedTransactionInfo: { selectedFee: undefined },
                setShowReserveBanner: jest.fn(),
                setAccountOnChange: jest.fn(),
            });

            return { inputs, methods };
        },
        { store },
    );

    return { ...utils, store };
};

describe('useExchangeFormInputs', () => {
    beforeEach(() => {
        mockComposeRequest.mockClear();
    });

    it('setRatioAmount fills the crypto amount with the divided balance and marks the fraction', () => {
        const { result } = renderExchangeFormInputs();

        act(() => {
            result.current.inputs.setRatioAmount(2);
        });

        expect(result.current.methods.getValues('outputs.0.amount')).toBe('1');
        expect(result.current.inputs.fractionButton).toBe(2);
    });

    it('setAllAmount marks the max output, triggers a compose and invalidates the selected quote', () => {
        const { result, store } = renderExchangeFormInputs();

        act(() => {
            result.current.inputs.setAllAmount();
        });

        expect(result.current.methods.getValues('setMaxOutputId')).toBe(0);
        expect(result.current.methods.getValues('outputs.0.fiat')).toBe('');
        expect(result.current.inputs.fractionButton).toBe(1);
        expect(mockComposeRequest).toHaveBeenCalledWith('outputs.0.amount');
        expect(store.getActions().map(action => action.type)).toContain(
            tradingExchangeActions.saveSelectedQuote.type,
        );
    });
});
