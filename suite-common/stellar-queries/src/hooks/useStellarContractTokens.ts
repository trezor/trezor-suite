import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type BlockchainRootState,
    type StellarContractTokensRootState,
    selectBlockchainUrlBySymbol,
    selectStellarContractTokens,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { STELLAR_CONTRACT_TOKENS } from '@trezor/network-stellar/constants';

import { stellarContractBalancesQuery } from '../contractBalances';
import { stellarTokenMetadataQuery } from '../queries';

const EMPTY_CONTRACTS: string[] = [];

/**
 * The SEP-41 holdings of a Stellar account, read straight from the network.
 *
 * Which contracts are worth asking about is the definitions' business — the published list, the
 * curated constants and whatever the user added by hand — so the answer is the same for every
 * screen showing this account and is fetched once for all of them.
 */
export const useStellarContractTokens = (account: Account | undefined) => {
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

    return stellarContractBalancesQuery.use(
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
export const useStellarAccountTokens = (account: Account | undefined) => {
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
