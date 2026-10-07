import type { TokenInfo, TokenStandard } from '@trezor/blockchain-link-types';
import type { GetTrezorConnectDep } from '@trezor/connect-common';

import type { GetAccountBalanceParams } from './ChainNetwork';
import { ChainNetworkError } from './ChainNetworkError';
import type { ChainTokenBalance } from './ChainTokenBalance';
import { subunitsToUnits } from './subunitsToUnits';
import { toCoinSymbol } from './toCoinSymbol';

export type FetchConnectTokensDeps = GetTrezorConnectDep<'getAccountInfo'>;

/**
 * How a network reads the tokens the user watches:
 * - `contract-filter`: one extra request per watched contract the answer left out;
 * - `stellar-contract-tokens`: the backend reads watched Soroban contracts itself.
 */
export type WatchedTokensStrategy =
    | { type: 'contract-filter'; isContractCaseInsensitive: boolean }
    | { type: 'stellar-contract-tokens' };

export type FetchConnectTokensParams = GetAccountBalanceParams & {
    /** The token standards the network counts as fungible; NFTs and the like are left out. */
    fungibleStandards: readonly TokenStandard[];
    useConnectionIdentity: boolean;

    /** The detail level at which the backend lists the account's tokens. */
    details: 'basic' | 'tokenBalances';
    watchedTokensStrategy: WatchedTokensStrategy;
};

export type FetchConnectTokens = (
    params: FetchConnectTokensParams,
) => Promise<readonly ChainTokenBalance[]>;

// Classic Stellar assets are `CODE-ISSUER`; only Soroban contract ids go to the backend.
const isStellarContractId = (id: string) => !id.includes('-');

const isSameContract = (strategy: WatchedTokensStrategy, a: string, b: string) =>
    strategy.type === 'contract-filter' && strategy.isContractCaseInsensitive
        ? a.toLowerCase() === b.toLowerCase()
        : a === b;

/**
 * Reads the fungible tokens an account holds through Connect. Every token the backend reports is
 * returned: which of them to show (known, unhidden) is the app's decision, not the network's.
 */
export const createFetchConnectTokens =
    (deps: FetchConnectTokensDeps): FetchConnectTokens =>
    async params => {
        const { ref, watchedTokensStrategy: strategy } = params;
        const watchedTokens = ref.watchedTokens ?? [];
        const request = {
            coin: toCoinSymbol(ref.symbol),
            descriptor: ref.descriptor,
            suppressBackupWarning: true,
            identity: params.useConnectionIdentity ? ref.connectionIdentity : undefined,
        };

        const result = await deps.getTrezorConnect().getAccountInfo({
            ...request,
            details: params.details,
            stellarContractTokens:
                strategy.type === 'stellar-contract-tokens'
                    ? watchedTokens.filter(isStellarContractId)
                    : undefined,
        });

        // The backend message can echo the descriptor, so it is dropped here.
        if (!result.success) {
            throw new ChainNetworkError('account-info-failed', ref.symbol);
        }

        const listedTokens = result.payload.tokens ?? [];
        const missingWatchedTokens =
            strategy.type === 'contract-filter'
                ? watchedTokens.filter(
                      watched =>
                          !listedTokens.some(token =>
                              isSameContract(strategy, token.contract, watched),
                          ),
                  )
                : [];

        // A watched token the backend cannot answer for is left out, as before.
        const watchedResults = await Promise.all(
            missingWatchedTokens.map(contractFilter =>
                deps.getTrezorConnect().getAccountInfo({
                    ...request,
                    details: 'tokenBalances',
                    contractFilter,
                }),
            ),
        );
        const watchedTokenInfos = watchedResults.flatMap(watched =>
            watched.success ? (watched.payload.tokens ?? []) : [],
        );

        return [...listedTokens, ...watchedTokenInfos]
            .filter((token: TokenInfo) => params.fungibleStandards.includes(token.standard))
            .map(token => ({
                standard: token.standard,
                contract: token.contract,
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
                balance: subunitsToUnits(token.balance ?? '0', token.decimals),
            }));
    };
