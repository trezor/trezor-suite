import { isCodesignBuild } from '@trezor/env-utils';
import { createContext } from '@trezor/utils';

import { type EarnStakingWorkerBaseUrl } from '../constants';

export const defaultEarnStakingWorkerBaseUrl: EarnStakingWorkerBaseUrl = isCodesignBuild()
    ? 'https://earn.trezor.io/staking/v1'
    : 'https://dev-earn.suite.sldev.cz/staking/v1';

export const earnStakingWorkerBaseUrl = createContext<EarnStakingWorkerBaseUrl>();
