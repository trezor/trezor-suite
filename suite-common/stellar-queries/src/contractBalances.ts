import { commonQueryKeys, createQueryDefinition } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';
import { enhanceTokens } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { STELLAR_CONTRACT_TOKENS } from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';

import { getStellarConnection } from './connection';

export interface StellarContractBalancesParams {
    /** The backend the account is loaded from; `wallet.blockchain[symbol].url`. */
    url: string;
    descriptor: string;
    /** Every contract worth asking about: the published definitions, the curated list, the watch list. */
    contracts: readonly string[];
    /** The account's classic trustlines, whose wrapping contracts are already reported as those. */
    classicContracts: readonly string[];
    /** Contracts the user added by hand, which stay visible at a zero balance. */
    watched: readonly string[];
    /**
     * What the published definitions say, for contracts that do not answer for themselves. Not part
     * of the key: the definitions are fetched once per session and never change under a fetch.
     */
    fallbacks?: Record<string, { name?: string; symbol?: string; decimals?: number }>;
}

const curatedByContract = new Map(STELLAR_CONTRACT_TOKENS.map(token => [token.contract, token]));

/**
 * The SEP-41 holdings of one account.
 *
 * Read in one batch of ledger keys rather than per contract, which is why the whole contract list
 * shares a single cache entry.
 *
 * The answer is `enhanceTokens`-ed, exactly as `accountsActions.updateAccount` does to the tokens
 * the worker reports, so that a holding reads the same whichever of the two a screen took it from —
 * the network reports base subunits, `account.tokens` is in whole units.
 */
export const stellarContractBalancesQuery = createQueryDefinition<
    StellarContractBalancesParams,
    NonNullable<Account['tokens']>
>({
    queryKey: ({ descriptor, contracts, classicContracts }) =>
        commonQueryKeys.stellarContractBalances(descriptor, [...contracts, ...classicContracts]),
    queryFn: async ({ url, descriptor, contracts, classicContracts, watched, fallbacks }) => {
        if (contracts.length === 0) return [];

        const connection = await getStellarConnection(url);
        const { computeSorobanAssetContractId, isValidContractId, readSep41Tokens } =
            await stellar();

        // A watched SAC would double-count the classic trustline the account already reports.
        const classicSacIds = new Set(
            classicContracts.flatMap(contract => {
                try {
                    return [computeSorobanAssetContractId(contract).sorobanAssetContractId];
                } catch {
                    return [];
                }
            }),
        );
        const toRead = contracts.filter(
            contract => isValidContractId(contract) && !classicSacIds.has(contract),
        );
        if (toRead.length === 0) return [];

        const tokens = await readSep41Tokens(
            connection.rpc,
            descriptor,
            toRead,
            connection.passphrase,
        );

        const isWatched = new Set(watched);

        return enhanceTokens(
            tokens
                // Curated tokens surface only when held; user-added ones stay visible at zero.
                .filter(token => token.balance !== '0' || isWatched.has(token.contract))
                .flatMap((token): TokenInfo[] => {
                    const fallback =
                        fallbacks?.[token.contract] ?? curatedByContract.get(token.contract);
                    const decimals = token.decimals ?? fallback?.decimals;

                    // Defaulting to 7 decimals would inflate an 18-decimal holding 10^11 times.
                    if (decimals == null) return [];

                    return [
                        {
                            standard: 'STELLAR-CONTRACT',
                            contract: token.contract,
                            balance: token.balance,
                            name: token.name ?? fallback?.name,
                            symbol: (token.symbol ?? fallback?.symbol ?? '').toUpperCase(),
                            decimals,
                        },
                    ];
                }),
        );
    },
    options: {
        // Balances go stale with every ledger; the account refetch that follows a transaction is
        // what invalidates them, so nothing is gained by expiring them on a timer.
        staleTime: Infinity,
    },
});
