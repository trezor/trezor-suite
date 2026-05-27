import { isCodesignBuild } from '@trezor/env-utils';

export const YIELD_BASE_URL = isCodesignBuild()
    ? 'https://earn.trezor.io/yield'
    : 'https://dev-earn.suite.sldev.cz/yield';

export const YIELD_XYZ_BASE_URL = `${YIELD_BASE_URL}/yieldxyz/v1` as const;
export const MERKL_BASE_URL = `${YIELD_BASE_URL}/merkl/v1` as const;
export const YIELD_VAULTS_URL = `${YIELD_BASE_URL}/vaults/v1` as const;
