import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { renderHookWithStoreProvider } from '@suite-native/test-utils';
import { type TokensRootState } from '@suite-native/tokens';

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
        renderHookWithStoreProvider(() => useAmountInputDecimals(account, contractAddress));

    beforeEach(() => {
        jest.clearAllMocks();
        mockSelectAccountTokenDecimals.mockReturnValue(6);
    });

    it('should be undefined when account is not set', () => {
        const { result } = renderUseAmountInputDecimals(undefined, undefined);

        expect(result.current).toBeUndefined();
    });

    it('should limit value to decimals based on network.decimals value for networks', () => {
        const account = {
            key: 'account_key' as AccountKey, // Todo: create properly via `createAccountKey()`
            symbol: 'eth',
        } as Account;
        const { result } = renderUseAmountInputDecimals(account, undefined);

        expect(result.current).toEqual(18);
    });

    it('should limit value to decimals based on selectAccountTokenDecimals return value', () => {
        const account = {
            key: 'account_key' as AccountKey, // Todo: create properly via `createAccountKey()`
            symbol: 'eth',
        } as Account;
        const contractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
        const { result } = renderUseAmountInputDecimals(account, contractAddress);

        expect(result.current).toEqual(6);
    });

    it('should return undefined when selectAccountTokenDecimals returns nullish value', () => {
        mockSelectAccountTokenDecimals.mockReturnValue(null);
        const account = {
            key: 'account_key' as AccountKey, // Todo: create properly via `createAccountKey()`
            symbol: 'eth',
        } as Account;
        const contractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
        const { result } = renderUseAmountInputDecimals(account, contractAddress);

        expect(result.current).toBeUndefined();
    });
});
