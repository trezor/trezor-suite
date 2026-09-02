/* eslint-disable no-console */
import { YIELD_VAULTS_URL } from '../constants';

/**
 * Mirror of the worker's `YieldVaults` schema, narrowed to the keys this script
 * needs. Inlined to keep the script free of a runtime dep on
 * `@suite-common/earn-stablecoin-api`.
 *
 * Keyed by CoinGecko asset platform id — the same ids this script takes as CLI
 * args — so no network-symbol mapping is needed. A platform the worker does not
 * support for vaults is simply absent.
 */
type YieldDefinitions = Record<
    string,
    | {
          yieldId: string;
          address: string;
      }[]
    | undefined
>;

export const fetchVaultDefinitions = async (): Promise<YieldDefinitions> => {
    const response = await fetch(YIELD_VAULTS_URL);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch vault definitions from ${YIELD_VAULTS_URL}: ${response.status} ${response.statusText}`,
        );
    }

    const vaultDefinitions: YieldDefinitions = await response.json();
    const platformIds = Object.keys(vaultDefinitions);

    console.log('Vault definitions fetched for platforms:', platformIds.join(', '));

    return vaultDefinitions;
};
