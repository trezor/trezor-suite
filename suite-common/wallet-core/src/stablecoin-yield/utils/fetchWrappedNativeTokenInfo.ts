import { getWrappedNativeAddress } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect, { type TokenInfo } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

const WRAPPED_NATIVE_TOKEN_FETCH_TIMEOUT_MS = 15_000;

type FetchWrappedNativeTokenInfoParams = {
    account: Account;
};

/**
 * Fetches the wrapped-native token (e.g. WETH) of the account's network with its current on-chain
 * balance from the blockchain backend. Returns null when the network has no wrapped-native token
 * or the backend does not report it.
 */
export const fetchWrappedNativeTokenInfo = async ({
    account,
}: FetchWrappedNativeTokenInfoParams): Promise<TokenInfo | null> => {
    const wrappedNativeContract = getWrappedNativeAddress(account.symbol);

    if (!wrappedNativeContract) {
        return null;
    }

    const response = await Promise.race([
        TrezorConnect.getAccountInfo({
            coin: asCoinSymbol(account.symbol),
            identity: tryGetAccountIdentity(account),
            descriptor: account.descriptor,
            details: 'tokenBalances',
            contractFilter: wrappedNativeContract,
            suppressBackupWarning: true,
        }),
        new Promise<never>((_, reject) =>
            setTimeout(
                () => reject(new Error('Wrapped-native token fetch timed out')),
                WRAPPED_NATIVE_TOKEN_FETCH_TIMEOUT_MS,
            ),
        ),
    ]);

    if (!response.success) {
        return null;
    }

    return (
        response.payload.tokens?.find(
            token => token.contract.toLowerCase() === wrappedNativeContract.toLowerCase(),
        ) ?? null
    );
};
