import { type EarnYieldWorkerBaseUrl } from '@suite-common/earn-stablecoin-defs';
import { isCodesignBuild } from '@trezor/env-utils';
import { createContext } from '@trezor/utils';

export const defaultEarnYieldWorkerBaseUrl: EarnYieldWorkerBaseUrl = isCodesignBuild()
    ? 'https://earn.trezor.io/yield'
    : 'https://dev-earn.suite.sldev.cz/yield';

export const earnYieldWorkerBaseUrl = createContext<EarnYieldWorkerBaseUrl>();
