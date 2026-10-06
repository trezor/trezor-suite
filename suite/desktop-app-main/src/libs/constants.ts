import { isDevEnv } from '@suite-common/suite-utils';
import { isCodesignBuild } from '@trezor/env-utils';

export const APP_NAME_BARE = 'Trezor Suite';
export const APP_NAME = `${APP_NAME_BARE}${
    isCodesignBuild() ? '' : ` ${isDevEnv ? 'Local' : 'Dev'}`
}`;
