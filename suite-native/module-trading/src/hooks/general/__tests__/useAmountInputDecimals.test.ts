import { Account, AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils';
import { TokensRootState } from '@suite-native/tokens';

import { useAmountInputDecimals } from '../useAmountInputDecimals';

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
    const renderUseAmountInputDecimals = (account?: Account, contractAddress?: TokenAddress) =>
        renderHookWithStoreProviderAsync(() => useAmountInputDecimals(account, contractAddress));

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
            key: 'account_key',
            symbol: 'eth',
        } as Account;
        const { result } = await renderUseAmountInputDecimals(account, undefined);

        expect(result.current).toEqual(18);
    });

    it('should limit value to decimals based on selectAccountTokenDecimals return value', async () => {
        const account = {
            key: 'account_key',
            symbol: 'eth',
        } as Account;
        const contractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
        const { result } = await renderUseAmountInputDecimals(account, contractAddress);

        expect(result.current).toEqual(6);
    });

    it('should return undefined when selectAccountTokenDecimals returns nullish value', async () => {
        mockSelectAccountTokenDecimals.mockReturnValue(null);
        const account = {
            key: 'account_key',
            symbol: 'eth',
        } as Account;
        const contractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
        const { result } = await renderUseAmountInputDecimals(account, contractAddress);

        expect(result.current).toBeUndefined();
    });
});
