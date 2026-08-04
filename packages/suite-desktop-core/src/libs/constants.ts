import { isDevEnv } from '@suite-common/suite-utils';
import { isCodesignBuild } from '@trezor/env-utils';

// Suite Dark flavour: brand name.
export const APP_NAME_BARE = 'Suite Dark';
export const APP_NAME = `${APP_NAME_BARE}${
    isCodesignBuild() ? '' : ` ${isDevEnv ? 'Local' : 'Dev'}`
}`;
