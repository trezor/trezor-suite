import { type CryptoId, type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { toTokenAddress } from '@suite-common/tokens';
import {
    type TradingAssetOption,
    type TradingAssetSellOption,
    type TradingExchangeFormProps,
    initialState,
} from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingExchangeCryptoAndProviderInfo } from './useTradingExchangeCryptoAndProviderInfo';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

type CryptoInfoFormValues = Pick<
    TradingExchangeFormProps,
    'sendCryptoSelect' | 'receiveCryptoSelect' | 'selectedFee'
>;

const mockGetValues = jest.fn<CryptoInfoFormValues, []>();

jest.mock('#src/hooks/wallet/trading/form/useTradingCommonForm', () => ({
    useTradingFormContext: () => ({ getValues: mockGetValues }),
}));

const usdt: TradingAssetSellOption = {
    id: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
    coingeckoId: 'ethereum',
    networkName: 'Ethereum',
    networkSymbol: asNetworkSymbol('eth'),
    isNativeToken: false,
    name: 'Tether',
    symbol: 'usdt',
    displaySymbol: 'USDT',
    contractAddress: toTokenAddress('0xdac17f958d2ee523a2206206994597c13d831ec7'),
    accountKey: mockWalletAccount({ symbol: asNetworkSymbol('eth') }).key,
};
const eth: TradingAssetOption = {
    id: 'ethereum' as CryptoId,
    coingeckoId: 'ethereum',
    networkName: 'Ethereum',
    networkSymbol: asNetworkSymbol('eth'),
    isNativeToken: true,
    name: 'Ethereum',
    symbol: asNetworkSymbol('eth'),
    displaySymbol: 'ETH',
    contractAddress: null,
};
const provider: ExchangeProviderInfo = {
    name: 'test-dex',
    companyName: 'Test DEX',
    logo: '',
    isActive: true,
    isFixedRate: false,
    isDex: true,
    buyTickers: [],
    sellTickers: [],
    addressFormats: {},
    supportUrl: '',
    kycPolicyType: 'noKYC',
};
const selectedQuote: ExchangeTrade = { exchange: provider.name, status: 'CONFIRM' };

const renderGetCryptoInfo = () => {
    const preloadedState: MockSuiteState = {
        ...mockInitialAppState,
        wallet: {
            ...mockInitialAppState.wallet,
            trading: {
                ...initialState,
                exchange: {
                    ...initialState.exchange,
                    selectedQuote,
                    exchangeInfo: {
                        providerInfos: { [provider.name]: provider },
                        buyCryptoIds: [],
                        sellCryptoIds: [],
                    },
                },
            },
        },
    };
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState });

    return renderHookWithStoreProvider(() => useTradingExchangeCryptoAndProviderInfo(), {
        services,
    }).result;
};

describe('useTradingExchangeCryptoAndProviderInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('describes the form assets, fee level and the selected quote provider', () => {
        mockGetValues.mockReturnValue({
            sendCryptoSelect: usdt,
            receiveCryptoSelect: eth,
            selectedFee: 'custom',
        });

        const result = renderGetCryptoInfo();

        expect(result.current()).toEqual({
            sendCryptoLabel: 'USDT',
            sendCryptoNetworkSymbol: 'eth',
            sendCryptoContractAddress: usdt.contractAddress,
            receiveCryptoLabel: 'ETH',
            receiveCryptoNetworkSymbol: 'eth',
            receiveCryptoContractAddress: undefined,
            exchangeName: provider.companyName,
            selectedFee: 'custom',
        });
    });

    it('reads the form values when called, not when rendered', () => {
        mockGetValues.mockReturnValue({
            sendCryptoSelect: usdt,
            receiveCryptoSelect: eth,
            selectedFee: 'normal',
        });
        const result = renderGetCryptoInfo();

        expect(mockGetValues).not.toHaveBeenCalled();

        mockGetValues.mockReturnValue({
            sendCryptoSelect: usdt,
            receiveCryptoSelect: eth,
            selectedFee: 'high',
        });

        expect(result.current()).toMatchObject({ selectedFee: 'high' });
    });
});
