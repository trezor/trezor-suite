import { stellarTokenInfoQuery } from '../queries';

/** The definitions' view of one token; until they load, only its asset code is known. */
export const useStellarTokenInfo = (contract: string) => stellarTokenInfoQuery.use(contract);

/** The same for a list of tokens, fetched in parallel and cached one entry per token. */
export const useStellarTokenInfos = (contracts: readonly string[]) =>
    stellarTokenInfoQuery.useMany(contracts);
