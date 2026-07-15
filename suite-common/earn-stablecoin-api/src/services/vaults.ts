import { GetYieldVaultResponse } from '@suite-common/earn-stablecoin-defs';
import { createHttpClient } from '@suite-common/http-client';
import { getSuiteVersion } from '@trezor/env-utils';

import { earnYieldWorkerBaseUrl } from '../context';

export const vaultsApi = createHttpClient({
    async baseUrl() {
        const baseUrl = await earnYieldWorkerBaseUrl.get();

        return `${baseUrl}/vaults/v1`;
    },
    headers: { 'X-Suite-Version': getSuiteVersion() },
});

export const getYieldVault = vaultsApi('/:networkSymbol/:vaultId', {
    method: 'GET',
    schema: GetYieldVaultResponse,
});
