import { getEnvironment, getSuiteVersion, isCodesignBuild } from '@trezor/env-utils';

import type { ReportStakingTxIdsSuite, ReportStakingTxIdsSuiteBuild } from '../../api/types';

const getSuiteBuild = (): ReportStakingTxIdsSuiteBuild => (isCodesignBuild() ? 'prod' : 'dev');

export const getSuiteInfo = (): ReportStakingTxIdsSuite => ({
    version: getSuiteVersion(),
    platform: getEnvironment(),
    build: getSuiteBuild(),
});
