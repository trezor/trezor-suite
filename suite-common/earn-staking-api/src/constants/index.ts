import { isCodesignBuild } from '@trezor/env-utils';

export const EARN_API_BASE_URL = isCodesignBuild()
    ? 'https://earn.trezor.io/staking/v1'
    : 'https://dev-earn.suite.sldev.cz/staking/v1';
