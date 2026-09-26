/* eslint-disable no-console */
import { publicApi } from './api';
import { YIELD_VAULTS_URL } from '../constants';
import { type YieldDefinitions, yieldDefinitionsSchema } from '../schemas';

const fetchYieldVaults = publicApi(YIELD_VAULTS_URL, {
    method: 'GET',
    schema: yieldDefinitionsSchema,
});

export const fetchVaultDefinitions = async (): Promise<YieldDefinitions> => {
    const vaultDefinitions = await fetchYieldVaults();
    const platformIds = Object.keys(vaultDefinitions);

    console.log('Vault definitions fetched for platforms:', platformIds.join(', '));

    return vaultDefinitions;
};
