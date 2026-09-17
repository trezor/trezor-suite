import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    type BlockchainRootState,
    type StellarContractTokensRootState,
    selectBlockchainUrlBySymbol,
    selectStellarContractTokens,
    selectStellarDiscoveredContractTokens,
    stellarDiscoveredContractTokensActions,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { STELLAR_CONTRACT_TOKENS } from '@trezor/network-stellar/constants';

import { stellarContractBalancesQuery } from '../contractBalances';
import { stellarTokenMetadataQuery } from '../queries';

const EMPTY_CONTRACTS: string[] = [];

/**
 * Hands what the sweep found to the account fetch, which would otherwise have to sweep for itself.
 *
 * Only the contracts are remembered, never their balances: the point is to tell the backend which
 * of them are worth reading, and a remembered balance would be a second, staler copy of one the
 * query already holds.
 */
const useRememberDiscoveredContracts = (
    accountKey: AccountKey | undefined,
    tokens: NonNullable<Account['tokens']> | undefined,
) => {
    const { dispatch } = useServices(selectDispatch);
    const known = useSelector((state: StellarContractTokensRootState) =>
        accountKey ? selectStellarDiscoveredContractTokens(state, accountKey) : EMPTY_CONTRACTS,
    );

    const discovered = useMemo(() => tokens?.map(token => token.contract).sort(), [tokens]);

    useEffect(() => {
        if (!accountKey || !discovered) return;

        // The account fetch this drives would otherwise be dispatched on every settled query.
        const isUnchanged =
            discovered.length === known.length &&
            discovered.every((contract, index) => contract === known[index]);
        if (isUnchanged) return;

        dispatch(
            stellarDiscoveredContractTokensActions.setDiscoveredContractTokens({
                accountKey,
                contracts: discovered,
            }),
        );
    }, [accountKey, discovered, dispatch, known]);
};

/**
 * The SEP-41 holdings of a Stellar account, read straight from the network.
 *
 * Which contracts are worth asking about is the definitions' business — the published list, the
 * curated constants and whatever the user added by hand — so the answer is the same for every
 * screen showing this account and is fetched once for all of them.
 */
/** `null` is what the account selectors answer with, so it is accepted as "no account". */
export const useStellarContractTokens = (account: Account | null | undefined) => {
    const isStellarAccount = account?.networkType === 'stellar';
    const url = useSelector((state: BlockchainRootState) =>
        // Testnet is served by a backend of its own, so the account's own symbol decides.
        account ? selectBlockchainUrlBySymbol(state, account.symbol) : undefined,
    );
    const watched = useSelector((state: StellarContractTokensRootState) =>
        account ? selectStellarContractTokens(state, account.key) : EMPTY_CONTRACTS,
    );
    const { data: tokenMetadata } = stellarTokenMetadataQuery.use(undefined, {
        enabled: isStellarAccount,
    });

    const contracts = useMemo(
        () => [
            // Classic `CODE-ISSUER` keys are filtered out by the runtime's own check once it is in.
            ...new Set([
                ...Object.keys(tokenMetadata ?? {}),
                ...STELLAR_CONTRACT_TOKENS.map(token => token.contract),
                ...watched,
            ]),
        ],
        [tokenMetadata, watched],
    );

    const classicContracts = useMemo(
        () =>
            (account?.tokens ?? [])
                .filter(token => token.standard === 'STELLAR-CLASSIC')
                .map(token => token.contract),
        [account?.tokens],
    );

    const query = stellarContractBalancesQuery.use(
        {
            url: url ?? '',
            descriptor: account?.descriptor ?? '',
            contracts,
            classicContracts,
            watched,
            fallbacks: tokenMetadata,
        },
        // Nothing can be read before the backend the account is loaded from is known.
        { enabled: isStellarAccount && Boolean(url) },
    );

    useRememberDiscoveredContracts(account?.key, query.data);

    return query;
};

/**
 * The account's tokens, with its SEP-41 holdings supplied by the query rather than by whatever the
 * last account fetch happened to report.
 *
 * A screen showing Stellar tokens reads this instead of `account.tokens`, so the contract balances
 * refresh on their own and every screen shares the one fetch. Classic trustlines are left as they
 * are: they come out of the same ledger read as the account's own balance, so asking for them
 * separately would only duplicate that read.
 */
export const useStellarAccountTokens = (account: Account | null | undefined) => {
    const { data: contractTokens } = useStellarContractTokens(account);
    const accountTokens = account?.tokens;
    const isStellarAccount = account?.networkType === 'stellar';

    return useMemo(() => {
        if (!isStellarAccount || !contractTokens) return accountTokens;

        return [
            ...(accountTokens ?? []).filter(token => token.standard !== 'STELLAR-CONTRACT'),
            ...contractTokens,
        ];
    }, [accountTokens, contractTokens, isStellarAccount]);
};
