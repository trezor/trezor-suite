import type { TokenStandard } from '@trezor/blockchain-link-types';
import type { GetTrezorConnectDep } from '@trezor/connect-common';

import type { GetAccountBalanceParams } from './ChainNetwork';
import { ChainNetworkError } from './ChainNetworkError';
import type { ChainTokenBalance } from './ChainTokenBalance';
import { subunitsToUnits } from './subunitsToUnits';
import { toCoinSymbol } from './toCoinSymbol';

export type FetchConnectTokensDeps = GetTrezorConnectDep<'getAccountInfo'>;

export type FetchConnectTokensParams = GetAccountBalanceParams & {
    /** The token standards the network counts as fungible; NFTs and the like are left out. */
    fungibleStandards: readonly TokenStandard[];
    useConnectionIdentity: boolean;
};

export type FetchConnectTokens = (
    params: FetchConnectTokensParams,
) => Promise<readonly ChainTokenBalance[]>;

/**
 * Reads the fungible tokens an account holds through Connect. Every token the backend reports is
 * returned: which of them to show (known, unhidden) is the app's decision, not the network's.
 */
export const createFetchConnectTokens =
    (deps: FetchConnectTokensDeps): FetchConnectTokens =>
    async params => {
        const result = await deps.getTrezorConnect().getAccountInfo({
            coin: toCoinSymbol(params.ref.symbol),
            descriptor: params.ref.descriptor,
            details: 'tokenBalances',
            suppressBackupWarning: true,
            identity: params.useConnectionIdentity ? params.ref.connectionIdentity : undefined,
        });

        // The backend message can echo the descriptor, so it is dropped here.
        if (!result.success) {
            throw new ChainNetworkError('account-info-failed', params.ref.symbol);
        }

        return (result.payload.tokens ?? [])
            .filter(token => params.fungibleStandards.includes(token.standard))
            .map(token => ({
                standard: token.standard,
                contract: token.contract,
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
                balance: subunitsToUnits(token.balance ?? '0', token.decimals),
            }));
    };
