import { createHttpClient } from '@suite-common/http-client';
import { getSuiteVersion } from '@trezor/env-utils';

import { getYieldVaultResponse } from '../api/schemas';
import { YIELD_VAULTS_URL } from '../constants';

export const vaultsApi = createHttpClient({
    baseUrl: YIELD_VAULTS_URL,
    headers: { 'X-Suite-Version': getSuiteVersion() },
});

export const getYieldVault = vaultsApi('/:networkSymbol/:vaultId', {
    method: 'GET',
    schema: getYieldVaultResponse,
});
