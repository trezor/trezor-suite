import { useForm } from 'react-hook-form';

import { act, waitFor } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import { createTestStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type TradingAssetSellOption, type TradingSellFormProps } from '@suite-common/trading';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useSellFormInputs } from './useSellFormInputs';

jest.mock('src/hooks/wallet/useBitcoinAmountUnit', () => ({
    useBitcoinAmountUnit: () => ({ isBtcSatsAmountUnit: false }),
}));

jest.mock('src/hooks/wallet/trading/form/common/useTradingAssetDecimals', () => ({
    useTradingAssetDecimals: () => ({ getAssetDecimals: () => 8 }),
}));

const mockFiatRatesUpdater = jest.fn(() => Promise.resolve({ rate: 50000 }));
jest.mock('src/hooks/wallet/trading/form/common/useTradingFiatValues', () => ({
    useTradingFiatValues: () => ({
        fiatRate: { rate: 50000 },
        fiatRatesUpdater: mockFiatRatesUpdater,
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

const btcSymbol = toNetworkSymbolNonTestnet('btc');
const ACCOUNT = mockWalletAccount({ symbol: btcSymbol, formattedBalance: '2' });

const SEND_CRYPTO_SELECT: TradingAssetSellOption = {
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: btcSymbol,
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: btcSymbol,
    accountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: btcSymbol }),
};

const DEFAULTS: TradingSellFormProps = {
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
    countrySelect: {
        value: 'CZ' as const,
        codeAlpha3: 'CZE',
        flag: '🇨🇿',
        name: 'Czechia',
        label: '🇨🇿 Czechia',
        shortLabel: '🇨🇿 CZE',
    },
    sendCryptoSelect: SEND_CRYPTO_SELECT,
    amountInCrypto: true,
    paymentMethod: undefined,
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

const renderSellFormInputs = () => {
    const store = createTestStore({
        extra: undefined,
        preloadedState: {
            wallet: {
                accounts: [ACCOUNT],
            },
        },
    });

    return renderHookWithStoreProvider(
        () => {
            const methods = useForm<TradingSellFormProps>({
                mode: 'onChange',
                defaultValues: DEFAULTS,
            });
            const inputs = useSellFormInputs({
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
};

describe('useSellFormInputs', () => {
    beforeEach(() => {
        mockComposeRequest.mockClear();
        mockFiatRatesUpdater.mockClear();
    });

    it('reports a non-zero balance for the passed account', () => {
        const { result } = renderSellFormInputs();

        expect(result.current.inputs.isBalanceZero).toBe(false);
    });

    it('setRatioAmount fills the crypto amount with the divided balance and marks the fraction', () => {
        const { result } = renderSellFormInputs();

        act(() => {
            result.current.inputs.setRatioAmount(2);
        });

        expect(result.current.methods.getValues('outputs.0.amount')).toBe('1');
        expect(result.current.inputs.fractionButton).toBe(2);
    });

    it('setAllAmount marks the max output, clears the fiat and triggers a compose', () => {
        const { result } = renderSellFormInputs();

        act(() => {
            result.current.inputs.setAllAmount();
        });

        expect(result.current.methods.getValues('setMaxOutputId')).toBe(0);
        expect(result.current.methods.getValues('outputs.0.fiat')).toBe('');
        expect(result.current.inputs.fractionButton).toBe(1);
        expect(mockComposeRequest).toHaveBeenCalledWith('outputs.0.amount');
    });

    it('setFractionButton clears the max output id for a non-max fraction', () => {
        const { result } = renderSellFormInputs();

        act(() => {
            result.current.methods.setValue('setMaxOutputId', 0);
            result.current.inputs.setFractionButton(4);
        });

        expect(result.current.methods.getValues('setMaxOutputId')).toBeUndefined();
        expect(result.current.inputs.fractionButton).toBe(4);
    });

    it('recalculates the crypto amount from the typed fiat amount after the debounce', async () => {
        const { result } = renderSellFormInputs();

        act(() => {
            result.current.methods.setValue('outputs.0.fiat', '100');
        });

        await waitFor(
            () => expect(result.current.methods.getValues('outputs.0.amount')).toBe('0.00200000'),
            { timeout: 1500 },
        );
    });
});
