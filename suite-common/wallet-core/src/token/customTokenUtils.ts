import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { findToken, isDirectRpcBackendType } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/connect';

export type CustomTokenInputError = 'invalid-address' | 'already-added';

export type CustomTokenFetchError = 'not-a-token' | 'fetch-failed';

type GetCustomTokenInputErrorParams = {
    contract: string;
    account: Pick<Account, 'symbol' | 'tokens'>;
    /** Hidden and unverified tokens of the account; adding one of them shows it. */
    hiddenTokens: TokenInfo[];
    isAddressValid: (address: string, symbol: NetworkSymbol) => boolean;
};

export const getCustomTokenInputError = ({
    contract,
    account,
    hiddenTokens,
    isAddressValid,
}: GetCustomTokenInputErrorParams): CustomTokenInputError | undefined => {
    if (!isAddressValid(contract, account.symbol)) return 'invalid-address';
    if (findToken(account.tokens, contract) && !findToken(hiddenTokens, contract)) {
        return 'already-added';
    }

    return undefined;
};

// Blockbook answers a contract filter for any address, echoing the address as the name.
const isBlockbookTokenRead = (token: TokenInfo) =>
    !!token.symbol && token.name?.toLowerCase() !== token.contract.toLowerCase();

// The direct-RPC worker reports metadata it could not read as "unknown".
const UNREADABLE_DIRECT_RPC_METADATA = 'unknown';

const isDirectRpcTokenRead = (token: TokenInfo) =>
    !!token.symbol && token.symbol !== UNREADABLE_DIRECT_RPC_METADATA;

/** Only ERC-20 is supported: other standards hold a balance per token id. */
export const isSupportedCustomToken = (token: TokenInfo, account: Pick<Account, 'backendType'>) => {
    if (token.standard !== 'ERC20') return false;

    return isDirectRpcBackendType(account.backendType)
        ? isDirectRpcTokenRead(token)
        : isBlockbookTokenRead(token);
};
