import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { type TokensRootState } from '@suite-native/tokens';

import { useAmountInputDecimals } from './useAmountInputDecimals';

const ethSymbol = asNetworkSymbol('eth');

const mockSelectAccountTokenDecimals = jest.fn(
    (
        _state: TokensRootState,
        _accountKey?: AccountKey,
        _tokenAddress?: TokenAddress,
    ): null | number => null,
);

jest.mock('@suite-native/tokens', () => ({
    ...jest.requireActual('@suite-native/tokens'),
    selectAccountTokenDecimals: (
        state: TokensRootState,
        accountKey?: AccountKey,
        tokenAddress?: TokenAddress,
    ) => mockSelectAccountTokenDecimals(state, accountKey, tokenAddress),
}));

describe('useAmountInputDecimals', () => {
    const renderUseAmountInputDecimals = async (
        account?: Account,
        contractAddress?: TokenAddress,
    ) => await renderHookWithStoreProvider(() => useAmountInputDecimals(account, contractAddress));

    beforeEach(() => {
        jest.clearAllMocks();
        mockSelectAccountTokenDecimals.mockReturnValue(6);
    });

    it('should be undefined when account is not set', async () => {
        const { result } = await renderUseAmountInputDecimals(undefined, undefined);

        expect(result.current).toBeUndefined();
    });

    it('should limit value to decimals based on network.decimals value for networks', async () => {
        const account = {
            key: mockAccountKey({ symbol: ethSymbol, descriptor: 'accountKey' }),
            symbol: ethSymbol,
        } as Account;
        const { result } = await renderUseAmountInputDecimals(account, undefined);

        expect(result.current).toEqual(18);
    });

    it('should limit value to decimals based on selectAccountTokenDecimals return value', async () => {
        const account = {
            key: mockAccountKey({ symbol: ethSymbol, descriptor: 'accountKey' }),
            symbol: ethSymbol,
        } as Account;
        const contractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
        const { result } = await renderUseAmountInputDecimals(account, contractAddress);

        expect(result.current).toEqual(6);
    });

    it('should return undefined when selectAccountTokenDecimals returns nullish value', async () => {
        mockSelectAccountTokenDecimals.mockReturnValue(null);
        const account = {
            key: mockAccountKey({ symbol: ethSymbol, descriptor: 'accountKey' }),
            symbol: ethSymbol,
        } as Account;
        const contractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
        const { result } = await renderUseAmountInputDecimals(account, contractAddress);

        expect(result.current).toBeUndefined();
    });
});
