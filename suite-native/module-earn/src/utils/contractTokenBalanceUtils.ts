import { WRAPPED_NATIVE } from '@suite-common/wallet-config';
import { getYieldDepositableBalance } from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

type AccountToken = NonNullable<Account['tokens']>[number];

const isAccountTokenContractMatch = (
    account: Account,
    normalizedContract: string,
    accountTokenContract: string,
) => {
    const normalizedAccountTokenContract = getContractAddressForNetworkSymbol(
        account.symbol,
        accountTokenContract,
    );

    return normalizedAccountTokenContract === normalizedContract;
};

export const getAccountTokenByContract = (
    account: Account,
    tokenContract: string | null,
): AccountToken | null => {
    if (!tokenContract) {
        return null;
    }

    const normalizedContract = getContractAddressForNetworkSymbol(account.symbol, tokenContract);

    return (
        account.tokens?.find(token =>
            isAccountTokenContractMatch(account, normalizedContract, token.contract),
        ) ?? null
    );
};

/**
 * Balance a yield vault deposit can spend from the account. For a wrapped-native (WETH) vault the
 * native balance can be wrapped, so it counts in too; the fee reserve is deducted later, by the
 * wrap step's available-to-wrap amount.
 */
export const getYieldVaultDepositableBalance = (
    account: Account,
    vaultTokenContract: TokenAddress | null,
): string =>
    getYieldDepositableBalance({
        networkSymbol: account.symbol,
        nativeFormattedBalance: account.formattedBalance,
        vaultTokenAddress: vaultTokenContract,
        matchedTokenBalance: vaultTokenContract
            ? getAccountTokenByContract(account, vaultTokenContract)?.balance
            : null,
    });

/**
 * TokenInfo for the account's wrapped native token when the account does not track it yet, so a
 * wrap can add it. Wrapping emits no ERC-20 transfer, so the backend does not report the token on
 * its own; tracking it makes every account refresh fetch its balance (desktop parity, #30797).
 * Returns null for networks without a wrapped native token and when it is already tracked.
 */
export const getUntrackedWrappedNativeTokenInfo = (account: Account): TokenInfo | null => {
    const wrappedNative = WRAPPED_NATIVE[account.symbol];

    if (!wrappedNative || getAccountTokenByContract(account, wrappedNative.address)) {
        return null;
    }

    return {
        standard: 'ERC20',
        contract: wrappedNative.address,
        symbol: wrappedNative.symbol,
        name: wrappedNative.symbol,
        decimals: wrappedNative.decimals,
        balance: '0',
    };
};

export const hasPositiveContractTokenBalance = (
    account: Account,
    tokenContract: TokenAddress | null,
): boolean => {
    if (!tokenContract) {
        return false;
    }

    const normalizedContract = getContractAddressForNetworkSymbol(account.symbol, tokenContract);

    return (
        account.tokens?.some(
            token =>
                isAccountTokenContractMatch(account, normalizedContract, token.contract) &&
                new BigNumber(token.balance ?? '0').gt(0),
        ) ?? false
    );
};
