import { getEnvironment, getSuiteVersion, isCodesignBuild } from '@trezor/env-utils';

type SuiteBuild = 'dev' | 'prod';

const getSuiteBuild = (): SuiteBuild => (isCodesignBuild() ? 'prod' : 'dev');

export const getSuiteInfoHeaders = () => ({
    'X-Suite-Version': getSuiteVersion(),
    'X-Suite-Platform': getEnvironment(),
    'X-Suite-Build': getSuiteBuild(),
});

export type SuiteInfoHeaders = ReturnType<typeof getSuiteInfoHeaders>;
